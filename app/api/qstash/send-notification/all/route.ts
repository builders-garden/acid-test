import { sendFrameNotification } from "@/lib/notifs";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
});

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
        return new Response("Failed to send notification", { status: 500 });
      } else if (result.state === "no_token") {
        return new Response("No notification token available", { status: 404 });
      } else if (result.state === "rate_limit") {
        return new Response("Rate limit exceeded", { status: 429 });
      }
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
