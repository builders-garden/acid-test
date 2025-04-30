import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface AggregatedFid {
  fid: number;
  totalAmount: number;
}

export async function GET() {
  try {
    // Read the aggregated fids data
    const filePath = path.join(
      process.cwd(),
      "lib",
      "song-1-bug",
      "aggregated-fids.json"
    );
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent) as AggregatedFid[];

    return NextResponse.json({
      success: true,
      data,
      totalUniqueFids: data.length,
    });
  } catch (error) {
    console.error("Error reading aggregated FIDs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read aggregated FIDs" },
      { status: 500 }
    );
  }
}
