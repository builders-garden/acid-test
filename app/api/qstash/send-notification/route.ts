import { sendMiniAppNotification } from "@/lib/notifs";
import { z } from "zod";

const requestSchema = z.object({
  fids: z.array(z.number().min(1)),
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
  const { fids, title, text } = parsedBody.data;
  try {
    let result = await sendMiniAppNotification({
      fids: fids,
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

    console.log(`Notification sent: fids=${fids.join(", ")}, title=${title}`);
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
