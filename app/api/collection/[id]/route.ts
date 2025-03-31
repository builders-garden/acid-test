import { getCollectorsBySongId } from "@/lib/prisma/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: songId } = await params;

    if (songId) {
      const songIdNum = Number(songId);

      if (isNaN(songIdNum)) {
        return NextResponse.json(
          { collectors: [], error: "Invalid song ID" },
          { status: 400 }
        );
      }

      const collectors = await getCollectorsBySongId(songIdNum);
      return NextResponse.json(collectors);
    }
  } catch (error) {
    console.error("Error retrieving collection:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { collectors: [], error: errorMessage },
      { status: 500 }
    );
  }
}
