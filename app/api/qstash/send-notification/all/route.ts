import { sendFrameNotification } from "@/lib/notifs";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response("Invalid request data", {
      status: 400,
    });
  }
  const { title, text } = parsedBody.data;
  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      let result = await sendFrameNotification({
        fid: user.fid,
        title,
        body: text,
      });
      if (result.state === "error") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `Error sending notification to user ${user.fid}: ${result.error}`
        );
      } else if (result.state === "no_token") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `No token found for user ${user.fid}`
        );
      } else if (result.state === "rate_limit") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `Rate limit exceeded for user ${user.fid}`
        );
      }
      await sleep(15); // 15ms delay between each notification
    }

    console.log(`Notification sent: title=${title}`);

    return new Response("Notification scheduled successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response("Failed to send notification", {
      status: 500,
    });
  }
}
