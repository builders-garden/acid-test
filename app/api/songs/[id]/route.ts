import { NextResponse } from "next/server";
import { getSong, isInCollection } from "@/lib/prisma/queries";
import { auth } from "@/lib/auth"; // Assuming you have an auth helper

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const songId = parseInt(params.id);
    if (isNaN(songId)) {
      return NextResponse.json({ error: "Invalid song ID" }, { status: 400 });
    }

    // Get the song details
    const song = await getSong(songId);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Get the current user from the session/auth
    const session = await auth();
    const userId = session?.user?.id;

    // If user is logged in, check if the song is in their collection
    let isCollected = false;
    if (userId) {
      isCollected = await isInCollection(parseInt(userId), songId);
    }

    // Return song with collection status
    return NextResponse.json({
      ...song,
      isCollected
    });
  } catch (error) {
    console.error("Error fetching song:", error);
    return NextResponse.json(
      { error: "Failed to fetch song" },
      { status: 500 }
    );
  }
} 