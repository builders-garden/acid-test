import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface FidComparison {
  inMintsNotInCollectors: number[];
  inCollectorsNotInMints: number[];
  totalInMints: number;
  totalInCollectors: number;
  missingFids: { address: string; amount: number }[];
  addressesWithMultipleFids: {
    address: string;
    amount: number;
    fids: number[];
  }[];
}

export async function GET() {
  try {
    // Read the mints data
    const mintsPath = path.join(
      process.cwd(),
      "lib/song-1-bug/aggregated-mints-fid-3.json"
    );
    const mintsData = JSON.parse(fs.readFileSync(mintsPath, "utf-8"));

    // Extract all FIDs from the objects, including those in allFids arrays
    const mintsFids = new Set<number>();
    Object.values(mintsData).forEach((entry: any) => {
      if (typeof entry === "object") {
        if (entry.fid) {
          mintsFids.add(entry.fid);
        }
        if (entry.allFids && Array.isArray(entry.allFids)) {
          entry.allFids.forEach((fid: number) => mintsFids.add(fid));
        }
      }
    });

    // Track addresses without any FIDs
    const missingFids = Object.entries(mintsData)
      .filter(
        ([_, entry]: [string, any]) =>
          typeof entry === "object" &&
          !entry.fid &&
          (!entry.allFids || entry.allFids.length === 0)
      )
      .map(([address, entry]: [string, any]) => ({
        address,
        amount: entry.amount,
      }));

    // Track addresses with multiple FIDs
    const addressesWithMultipleFids = Object.entries(mintsData)
      .filter(
        ([_, entry]: [string, any]) =>
          typeof entry === "object" &&
          entry.allFids &&
          Array.isArray(entry.allFids) &&
          entry.allFids.length > 1
      )
      .map(([address, entry]: [string, any]) => ({
        address,
        amount: entry.amount,
        fids: entry.allFids,
      }));

    // Read the collectors data
    const collectorsPath = path.join(
      process.cwd(),
      "lib/song-1-bug/collectors-addresses.json"
    );
    const collectorsData = JSON.parse(fs.readFileSync(collectorsPath, "utf-8"));
    const collectorsFids = new Set(
      Object.keys(collectorsData).map((fid) => parseInt(fid, 10))
    );

    // Find FIDs that are in mints but not in collectors
    const inMintsNotInCollectors = Array.from(mintsFids).filter(
      (fid) => !collectorsFids.has(fid)
    );

    // Find FIDs that are in collectors but not in mints
    // We need to check if the FID exists in either fid or allFids of any address
    const inCollectorsNotInMints = Array.from(collectorsFids).filter((fid) => {
      // Check if this FID exists in any address's fid or allFids
      return !Object.values(mintsData).some((entry: any) => {
        if (typeof entry !== "object") return false;
        return (
          entry.fid === fid || (entry.allFids && entry.allFids.includes(fid))
        );
      });
    });

    const comparison: FidComparison = {
      inMintsNotInCollectors,
      inCollectorsNotInMints,
      totalInMints: mintsFids.size,
      totalInCollectors: collectorsFids.size,
      missingFids,
      addressesWithMultipleFids,
    };

    // Write results to a JSON file
    const outputPath = path.join(
      process.cwd(),
      "lib/song-1-bug/fid-comparison.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(comparison, null, 2));

    return NextResponse.json({
      success: true,
      message: "FID comparison completed successfully",
      outputPath,
      comparison,
    });
  } catch (error) {
    console.error("Error comparing FIDs:", error);
    return NextResponse.json(
      { error: "Failed to compare FIDs" },
      { status: 500 }
    );
  }
}
