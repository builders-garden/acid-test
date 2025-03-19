import { prisma } from "@/lib/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all redacted songs
    const redactedSongs = await prisma.redactedSong.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform to a simpler format for the frontend
    const formattedSongs = redactedSongs.map((song) => ({
      id: song.id,
      createdAt: Math.floor(song.createdAt.getTime() / 1000),
    }));

    return NextResponse.json(formattedSongs);
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

export async function POST() {
  try {
    const redactedSong = await prisma.redactedSong.create({
      data: {}, // No data needed - just uses defaults
    });

    return NextResponse.json({
      id: redactedSong.id,
      createdAt: Math.floor(redactedSong.createdAt.getTime() / 1000),
    });
  } catch (error) {
    console.error("Error creating redacted song placeholder:", error);
    return NextResponse.json(
      { error: "Failed to create redacted song placeholder" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
