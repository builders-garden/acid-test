import { fetchUser } from "@/lib/neynar";
import {
  createUser,
  getUser,
  setUserNotificationDetails,
} from "@/lib/prisma/queries";
import { InsertDbUser } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const requestHeaders = new Headers(request.headers);
    const fid = requestHeaders.get("x-user-fid");

    // Validate required fields
    if (fid === null) {
      return Response.json(
        { success: false, error: "fid is required" },
        { status: 400 }
      );
    }

    const user = await getUser(Number(fid));
    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();

    // Extract user details from the request
    const { fid, notificationDetails } = requestJson;

    // Validate required fields
    if (fid === undefined) {
      return Response.json(
        { success: false, error: "fid is required" },
        { status: 400 }
      );
    }

    const user = await getUser(fid);
    if (!user) {
      const neynarUser = await fetchUser(fid.toString());
      const newUser: InsertDbUser = {
        fid: Number(neynarUser.fid),
        username: neynarUser.username,
        displayName: neynarUser.display_name,
        avatarUrl: neynarUser.pfp_url,
        walletAddress: neynarUser.custody_address,
        notificationDetails: notificationDetails
          ? JSON.stringify(notificationDetails)
          : null,
      };
      await createUser(newUser);
      // TODO: Track signup event
    } else if (
      notificationDetails &&
      (user.notificationDetails === null ||
        (user.notificationDetails &&
          user.notificationDetails !== JSON.stringify(notificationDetails)))
    ) {
      await setUserNotificationDetails(fid, notificationDetails);
    }

    return Response.json({ success: true, data: user });
  } catch (error) {
    console.error("Error creating user:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
