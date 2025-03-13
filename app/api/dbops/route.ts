import {
    createSong,
    createCollection,
  } from "@/lib/prisma/queries";
  
  import { NextRequest } from "next/server";
  
  export async function POST(request: NextRequest) {
    try {
      const requestJson = await request.json();
  
      let data;
  
      // Check if the request is for creating a song
      if (requestJson.tokenId && requestJson.price && requestJson.startDate && requestJson.endDate) {
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
  
        // Create the collection
        data = await createCollection({
          userId: userId, 
          songId: songId, 
        });
      } else {
        // If the request doesn't match either case, return an error
        return Response.json({ success: false, error: "Invalid request body" }, { status: 400 });
      }
  
      // Return the created data
      return Response.json({ success: true, data });
    } catch (error) {
      // Handle any errors that occur during the process
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return Response.json({ success: false, error: errorMessage }, { status: 500 });
    }
  }