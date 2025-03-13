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

    // Check if in collection
    const isInUserCollection = await isInCollection(parseInt(userId), songId);
    
    if (!isInUserCollection) {
      return NextResponse.json(
        { message: "Song not in collection" },
        { status: 200 }
      );
    }

    // Remove from collection
    await prisma.collection.delete({
      where: {
        userId_songId: {
          userId: parseInt(userId),
          songId: songId
        }
      }
    });

    return NextResponse.json(
      { message: "Song removed from collection" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from collection:", error);
    return NextResponse.json(
      { error: "Failed to remove from collection" },
      { status: 500 }
    );
  }
} 