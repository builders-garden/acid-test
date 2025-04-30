import { NextResponse } from "next/server";
import processCsv from "@/lib/song-1-bug/retrieve-fid";

export async function GET() {
  try {
    console.log("Starting mint processing...");
    await processCsv();
    console.log("Mint processing completed successfully");
    return NextResponse.json({
      success: true,
      message: "Mint aggregation completed",
    });
  } catch (error) {
    console.error("Detailed error in mint processing:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process mints",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
