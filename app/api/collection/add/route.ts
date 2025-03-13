import { NextResponse } from "next/server";
import { isInCollection } from "@/lib/prisma/queries";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/lib/auth"; // Assuming you have an auth helper

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get song ID from request body
    const { songId } = await request.json();
    
    if (!songId || typeof songId !== 'number') {
      return NextResponse.json(
        { error: "Invalid song ID" },
        { status: 400 }
      );
    }

    // Check if the song exists
    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      );
    }

    // Check if already in collection
    const alreadyCollected = await isInCollection(parseInt(userId), songId);
    
    if (alreadyCollected) {
      return NextResponse.json(
        { message: "Song already in collection" },
        { status: 200 }
      );
    }

    // Add to collection
    await prisma.collection.create({
      data: {
        userId: parseInt(userId),
        songId: songId,
      }
    });

    return NextResponse.json(
      { message: "Song added to collection" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding to collection:", error);
    return NextResponse.json(
      { error: "Failed to add to collection" },
      { status: 500 }
    );
  }
} 