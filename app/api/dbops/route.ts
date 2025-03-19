import { createSong, createCollection } from "@/lib/prisma/queries";

import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();

    console.log("Request JSON:", requestJson);

    let data;

    // Check if the request is for creating a song
    if (
      requestJson.tokenId &&
      requestJson.price &&
      requestJson.startDate &&
      requestJson.endDate
    ) {
      // Extract song details from the request
      const { tokenId, title, startDate, endDate } = requestJson;

      // Create the song
      data = await createSong({
        id: tokenId,
        title,
        startDate,
        endDate,
      });
    }
    // Check if the request is for creating a collection
    else if (requestJson.userId && requestJson.songId) {
      // Extract collection details from the request
      const { userId, songId } = requestJson;

      // Ensure IDs are numbers
      const userIdNum = Number(userId);
      const songIdNum = Number(songId);

      if (isNaN(userIdNum) || isNaN(songIdNum)) {
        return Response.json(
          { success: false, error: "userId and songId must be valid numbers" },
          { status: 400 }
        );
      }

      // Create the collection
      data = await createCollection({
        userId: userIdNum,
        songId: songIdNum,
      });
    } else {
      // If the request doesn't match either case, return an error
      return Response.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Return the created data
    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Error creating song or collection:", error);
    // Handle any errors that occur during the process
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
