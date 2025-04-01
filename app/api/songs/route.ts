import { getAllSongsAndCollectors } from "@/lib/prisma/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const songs = await getAllSongsAndCollectors();
    return NextResponse.json(songs, {
      status: 200,
    });
  } catch (error) {
    console.error("Error retrieving songs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
