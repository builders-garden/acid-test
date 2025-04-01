import {
  sendDelayedNotification,
  sendDelayedNotificationBasedOnOwnership,
  sendDelayedNotificationToAll,
  sendDelayedNotificationToFids,
} from "@/lib/qstash";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  delay: z.number().int().min(0),
  fids: z.array(z.number().int().positive()).optional(),
  songId: z.number().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response("Invalid request data", {
      status: 400,
    });
  }
  const { title, text, delay, fids, songId } = parsedBody.data;
  try {
    if (fids && fids.length === 1) {
      await sendDelayedNotification(fids[0], title, text, delay);
    } else if (fids && fids.length > 1) {
      await sendDelayedNotificationToFids(fids, title, text, delay);
    } else if (songId) {
      await sendDelayedNotificationBasedOnOwnership(title, text, songId, delay);
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
