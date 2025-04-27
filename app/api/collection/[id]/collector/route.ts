import { getUserCollectionWithPosition } from "@/lib/prisma/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const songId = parseInt(params.id);
    const searchParams = new URL(request.url).searchParams;
    const fid = searchParams.get("fid");
    const amount = searchParams.get("amount");

    if (!fid) {
      return NextResponse.json(
        { error: "Missing fid parameter" },
        { status: 400 }
      );
    }

    const fidNumber = parseInt(fid);

    const result = await getUserCollectionWithPosition(songId, fidNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error retrieving collector data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
