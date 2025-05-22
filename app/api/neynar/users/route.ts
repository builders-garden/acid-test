import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { usernames } = await req.json();

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "Invalid or missing usernames array" },
        { status: 400 }
      );
    }

    // Remove duplicates from the usernames array
    const uniqueUsernames = Array.from(new Set(usernames));
    const users = await Promise.all(
      uniqueUsernames.map(async (username) => {
        try {
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/by_username?username=${username}`,
            {
              headers: {
                "x-api-key": env.NEYNAR_API_KEY!,
              },
            }
          );

          if (!response.ok) {
            console.error(
              `Failed to fetch user ${username}: ${response.status}`
            );
            return { username, fid: null, success: false };
          }

          const data = await response.json();
          return {
            username,
            fid: data.user?.fid || null,
            displayName: data.user?.displayName || null,
            pfpUrl: data.user?.pfp_url || null,
            success: true,
          };
        } catch (error) {
          console.error(`Error fetching user ${username}:`, error);
          return { username, fid: null, success: false };
        }
      })
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in Neynar API endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
