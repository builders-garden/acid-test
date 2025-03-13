import { prisma } from "@/lib/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Query the Song table for redacted songs (where isRedactedUntil is not null)
    const songs = await prisma.song.findMany({
      where: {
        isRedactedUntil: {
          not: null,
        },
      },
    });

    // Transform the data to match the expected format from the frontend
    const redactedSongs = songs.map((song) => ({
      tokenId: parseInt(song.cid), // Assuming cid stores the tokenId as a string
      redactedUntil: Math.floor(song.isRedactedUntil!.getTime() / 1000), // Convert Date to Unix timestamp
      title: song.cid, // Using cid as title placeholder
    }));

    return NextResponse.json(redactedSongs);
  } catch (error) {
    console.error("Error fetching redacted songs:", error);
    return NextResponse.json(
      { error: "Failed to fetch redacted songs" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tokenId, title, redactedUntil, startDate } = data;

    // Validate the data
    if (!redactedUntil || !startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert Unix timestamp to Date object
    const redactedUntilDate = new Date(redactedUntil * 1000);

    // Create or update the redacted song
    const song = await prisma.song.upsert({
      where: { cid: String(tokenId) },
      update: {
        isRedactedUntil: redactedUntilDate,
      },
      create: {
        cid: String(tokenId),
        isRedactedUntil: redactedUntilDate,
      },
    });

    // Return the data in the format expected by the frontend
    return NextResponse.json({
      tokenId: parseInt(song.cid),
      redactedUntil: Math.floor(song.isRedactedUntil!.getTime() / 1000),
      title: title || "Redacted Release",
    });
  } catch (error) {
    console.error("Error creating redacted song:", error);
    return NextResponse.json(
      { error: "Failed to create redacted song" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
