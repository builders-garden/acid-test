import { sendFrameNotification } from "@/lib/notifs";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    let result = await sendFrameNotification({
      fids: users.map((user) => user.fid),
      title,
      body: text,
    });
    if (result.state === "success") {
      console.log(
        `[QSTASH-${new Date().toISOString()}]`,
        `Notification sent to all users`
      );
      return new Response("Notification sent to all users", {
        status: 200,
      });
    } else {
      if (result.state === "error") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `Error sending notification to all users: ${JSON.stringify(
            result.error
          )}`
        );
      } else if (result.state === "no_token") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `No token found for all users`
        );
      } else if (result.state === "rate_limit") {
        console.error(
          `[QSTASH-${new Date().toISOString()}]`,
          `Rate limit exceeded for all users`
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
