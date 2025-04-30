import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import fs from "fs";
import path from "path";

interface AggregatedFid {
  fid: number;
  totalAmount: number;
}

export async function POST() {
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

    // Process each aggregated FID entry
    for (const { fid, totalAmount } of data) {
      try {
        // Upsert the collection record
        await prisma.collection.upsert({
          where: {
            userId_songId: {
              userId: fid,
              songId: 1, // Assuming this is for song ID 1
            },
          },
          update: {
            amount: totalAmount,
          },
          create: {
            userId: fid,
            songId: 1, // Assuming this is for song ID 1
            amount: totalAmount,
          },
        });

        console.log(
          `Updated collection for FID ${fid} with amount ${totalAmount}`
        );
      } catch (error) {
        console.error(`Error updating collection for FID ${fid}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Collections updated successfully",
      totalUpdated: data.length,
    });
  } catch (error) {
    console.error("Error updating collections:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update collections" },
      { status: 500 }
    );
  }
}
