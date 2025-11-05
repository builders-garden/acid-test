import { sendMiniAppNotification } from "@/lib/notifs";
import { prisma } from "@/lib/prisma/client";
import { DbUser } from "@/lib/types";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  tokenId: z.number().int().positive(),
  didCollect: z
    .string()
    .min(1)
    .transform((val) => val === "true"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response("Invalid request data", {
      status: 400,
    });
  }
  const { title, text, tokenId, didCollect } = parsedBody.data;

  try {
    // Get all users
    const allUsers = await prisma.user.findMany();

    // Get users who collected the song
    const usersWithSong = await prisma.collection.findMany({
      where: {
        songId: tokenId,
      },
      select: {
        user: true,
      },
    });

    const collectorFids = new Set(
      usersWithSong.map((item: { user: any }) => item.user.fid)
    );

    // Select users based on didCollect flag
    const targetUsers = didCollect
      ? (usersWithSong.map((item: { user: any }) => item.user) as DbUser[])
      : (allUsers.filter((user) => !collectorFids.has(user.fid)) as DbUser[]);

    if (targetUsers.length === 0) {
      const message = didCollect
        ? "No users found who collected this song"
        : "No users found who haven't collected this song";
      return new Response(message, {
        status: 404,
      });
    }

    let result = await sendMiniAppNotification({
      fids: targetUsers.map((user: DbUser) => user.fid),
      title,
      body: text,
    });

    if (result.state === "success") {
      console.log(
        `[QSTASH-${new Date().toISOString()}]`,
        `Notification sent to ${targetUsers.length} users: title=${title}`
      );
      return new Response("Notification sent successfully", {
        status: 200,
      });
    } else {
      if (result.state === "error") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `Error sending notification: ${result.error}`
        );
      } else if (result.state === "no_token") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `No token found for users`
        );
      } else if (result.state === "rate_limit") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `Rate limit exceeded for users`
        );
      }
      return new Response("Failed to send notification", {
        status: 500,
      });
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response("Failed to send notification", {
      status: 500,
    });
  }
}
