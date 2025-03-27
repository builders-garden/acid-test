import { getSong, createSong } from "@/lib/prisma/queries";
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

    return Response.json({ success: true, data: song });
  } catch (error) {
    console.error("Error retrieving song:", error);
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

    // Extract song details from the request
    const { tokenId, title, startDate, endDate } = requestJson;

    // Validate required fields
    if (!tokenId || !title) {
      return Response.json(
        { success: false, error: "tokenId and title are required" },
        { status: 400 }
      );
    }

    // Create the song
    const song = await createSong({
      id: tokenId,
      title,
      startDate: startDate || "",
      endDate: endDate || "",
    });

    return Response.json({ success: true, data: song });
  } catch (error) {
    console.error("Error creating song:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
