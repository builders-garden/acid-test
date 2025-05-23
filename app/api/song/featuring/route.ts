import { getSong } from "@/lib/prisma/queries";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get songId from the URL query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { success: false, error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Ensure ID is a number
    const songId = Number(id);
    if (isNaN(songId)) {
      return Response.json(
        { success: false, error: "Song ID must be a valid number" },
        { status: 400 }
      );
    }

    // Get the song by ID
    const song = await getSong(songId);

    if (!song) {
      return Response.json(
        { success: false, error: "Song not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: song.feat ? JSON.parse(song.feat) : null,
    });
  } catch (error) {
    console.error("Error retrieving featuring details:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
