import { fetchUser } from "@/lib/neynar";
import { sendFrameNotification } from "@/lib/notifs";
import { trackEvent } from "@/lib/posthog/server";
import {
  createUser,
  deleteUserNotificationDetails,
  getUser,
  setUserNotificationDetails,
} from "@/lib/prisma/queries";
import { InsertDbUser } from "@/lib/types";
import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  let data;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        // The request data is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        // The app key is invalid
        return Response.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        // Internal error verifying the app key (caller may want to try again)
        return Response.json(
          { success: false, error: error.message },
          { status: 500 }
        );
    }
  }

  const fid = data.fid;
  const event = data.event;

  switch (event.event) {
    case "frame_added":
      if (event.notificationDetails) {
        const user = await getUser(fid);
        if (!user) {
          const neynarUser = await fetchUser(fid.toString());
          const newUser: InsertDbUser = {
            fid: Number(neynarUser.fid),
            username: neynarUser.username,
            displayName: neynarUser.display_name,
            avatarUrl: neynarUser.pfp_url,
            walletAddress: neynarUser.custody_address,
            notificationDetails: JSON.stringify(event.notificationDetails),
          };
          await createUser(newUser);
          trackEvent(fid, "signup", {
            fid,
          });
        } else {
          await setUserNotificationDetails(fid, event.notificationDetails);
        }
        await sendFrameNotification({
          fids: [fid],
          title: "Welcome to Acid Test!",
          body: "I'm so glad you've added us to your mini app collection. We'll hit you here, but only once in a while. Sincerely, chaim.eth :)",
        });
      } else {
        await deleteUserNotificationDetails(fid);
      }
      // TODO: Track frame added event
      break;
    case "frame_removed":
      await deleteUserNotificationDetails(fid);
      // TODO: Track event
      break;
    case "notifications_enabled":
      // TODO: Set user notification details
      await setUserNotificationDetails(fid, event.notificationDetails);
      await sendFrameNotification({
        fids: [fid],
        title: "Ding ding ding",
        body: "Notifications for Acid Test are now enabled",
      });
      // TODO: Track event
      break;
    case "notifications_disabled":
      await deleteUserNotificationDetails(fid);
      // TODO: Track event
      break;
  }

  return Response.json({ success: true });
}
