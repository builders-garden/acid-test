import { getCollectorsBySongId } from "@/lib/prisma/queries";
import { NextRequest, NextResponse } from "next/server";

const ITEMS_PER_PAGE = 50;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: songId } = await params;
    const cursor = request.nextUrl.searchParams.get("cursor");
    const cursorNum = cursor ? parseInt(cursor) : 0;

    if (songId) {
      const songIdNum = Number(songId);

      if (isNaN(songIdNum)) {
        return NextResponse.json(
          { collectors: [], error: "Invalid song ID" },
          { status: 400 }
        );
      }

      const collectors = await getCollectorsBySongId(songIdNum);
      const startIndex = cursorNum;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const items = collectors.slice(startIndex, endIndex);
      const nextCursor = endIndex < collectors.length ? endIndex : undefined;

      const totalMints = collectors.reduce(
        (sum, collector) => sum + collector.amount,
        0
      );

      return NextResponse.json({
        items,
        nextCursor,
        total: collectors.length,
        totalMints,
      });
    }
  } catch (error) {
    console.error("Error retrieving collection:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { items: [], error: errorMessage, totalMints: 0 },
      { status: 500 }
    );
  }
}
