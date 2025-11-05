import { getAllSongsAndCollectors } from "@/lib/prisma/queries";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  try {
    // Fetch all songs with collectors in one query
    const songs = await getAllSongsAndCollectors();

    // Fetch redacted songs
    const redactedSongs = await prisma.redactedSong.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Build summary with all needed data
    const songsSummary = songs.map((song) => {
      // Calculate total mints for this song
      const totalMints = song.collectors.reduce(
        (sum, collector) => sum + collector.amount,
        0
      );

      // Parse feat if it's still a string (safety check for data consistency)
      let parsedFeat = song.feat;
      if (typeof song.feat === "string") {
        try {
          parsedFeat = JSON.parse(song.feat);
        } catch (error) {
          console.error(`Failed to parse feat for song ${song.id}:`, error);
          parsedFeat = null;
        }
      }

      return {
        id: song.id,
        title: song.title,
        startDate: song.startDate,
        endDate: song.endDate,
        feat: parsedFeat,
        totalMints,
      };
    });

    return NextResponse.json(
      {
        songs: songsSummary,
        redactedSongs: redactedSongs.map((rs) => ({
          id: rs.id,
          createdAt: Math.floor(new Date(rs.createdAt).getTime() / 1000),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving songs summary:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
