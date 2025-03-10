import { sendFrameNotification } from "@/lib/notifs";
import { z } from "zod";

const requestSchema = z.object({
  fid: z.string().min(1),
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

  const { fid, title, text } = parsedBody.data;

  try {
    // TODO: this should send a notification to all the users, not just a single one
    await sendFrameNotification({ fid: Number(fid), title, body: text });

    console.log(`Notification sent: fid=${fid}, title=${title}`);
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
