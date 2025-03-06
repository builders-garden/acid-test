import { prisma } from "@/lib/prisma/client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Generate a random FID (Farcaster ID)
    const randomFid = Math.floor(Math.random() * 1000000);

    const newUser = await prisma.user.create({
      data: {
        fid: randomFid,
        username: `user_${randomFid}`,
        displayName: `Test User ${randomFid}`,
        avatarUrl: "https://placekitten.com/200/200",
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
