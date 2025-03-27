import { createCollection, getCollectorsBySongId } from "@/lib/prisma/queries";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();

    // Extract collection details from the request
    const { userId, songId, amount } = requestJson;

    // Validate required fields
    if (userId === undefined || songId === undefined || amount === undefined) {
      return Response.json(
        { success: false, error: "userId, songId, and amount are required" },
        { status: 400 }
      );
    }

    // Ensure IDs are numbers
    const userIdNum = Number(userId);
    const songIdNum = Number(songId);
    const amountNum = Number(amount);

    if (isNaN(userIdNum) || isNaN(songIdNum) || isNaN(amountNum)) {
      return Response.json(
        {
          success: false,
          error: "userId, songId, and amount must be valid numbers",
        },
        { status: 400 }
      );
    }

    const collection = await createCollection({
      userId: userIdNum,
      songId: songIdNum,
      amount: amountNum,
    });

    return Response.json({ success: true, data: collection });
  } catch (error) {
    console.error("Error creating collection entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
