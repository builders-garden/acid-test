import {
  sendDelayedNotification,
  sendDelayedNotificationToAll,
} from "@/lib/qstash";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  delay: z.number().int().min(0),
  fid: z.number().int().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response("Invalid request data", {
      status: 400,
    });
  }
  const { title, text, delay, fid } = parsedBody.data;
  try {
    if (fid) {
      await sendDelayedNotification(fid, title, text, delay);
    } else {
      await sendDelayedNotificationToAll(title, text, delay);
    }

    console.log(`Notification scheduled: title=${title}, delay=${delay}`);

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
