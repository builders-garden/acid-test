import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

interface AnalysisResult {
  mintedTokens: {
    fromJson: number;
    fromCsv: number;
    match: boolean;
  };
  totalAddresses: {
    fromJson: number;
    fromCsv: number;
    match: boolean;
  };
  fidComparison: {
    fidsInJsonNotInDb: number[];
    fidsInDbNotInJson: number[];
    totalFidsInJson: number;
    totalFidsInDb: number;
  };
}

export async function GET() {
  try {
    const jsonPath = path.join(
      process.cwd(),
      "lib/song-1-bug/final-aggregated.json"
    );
    const csvPath = path.join(
      process.cwd(),
      "lib/song-1-bug/acid test-transfersingle.csv"
    );
    const dbCollectorsPath = path.join(
      process.cwd(),
      "lib/song-1-bug/db-collectors.json"
    );

    // Read and parse the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const dbCollectors = JSON.parse(fs.readFileSync(dbCollectorsPath, "utf-8"));

    // Calculate totals from JSON
    const jsonTotalTokens = Object.values(jsonData)
      .filter((entry: any) => typeof entry === "object" && "amount" in entry)
      .reduce((sum: number, entry: any) => sum + entry.amount, 0);

    const jsonTotalAddresses = Object.keys(jsonData).filter(
      (key) => typeof jsonData[key] === "object" && "amount" in jsonData[key]
    ).length;

    // Calculate totals from CSV
    let csvTotalTokens = 0;
    let csvTotalAddresses = new Set<string>();

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => {
          if (data.to && data.value) {
            csvTotalTokens += parseInt(data.value, 10);
            csvTotalAddresses.add(data.to.toLowerCase());
          }
        })
        .on("end", () => resolve())
        .on("error", (error) => reject(error));
    });

    // Get all FIDs from JSON
    const jsonFids = new Set<number>();
    Object.values(jsonData).forEach((entry: any) => {
      if (typeof entry === "object" && entry.fid) {
        jsonFids.add(entry.fid);
      }
    });

    // Get all FIDs from db-collectors
    const dbFids = new Set<number>();
    dbCollectors.forEach((entry: any) => {
      if (entry.user && entry.user.fid) {
        dbFids.add(entry.user.fid);
      }
    });

    // Compare FIDs
    const fidsInJsonNotInDb = Array.from(jsonFids).filter(
      (fid) => !dbFids.has(fid)
    );
    const fidsInDbNotInJson = Array.from(dbFids).filter(
      (fid) => !jsonFids.has(fid)
    );

    const result: AnalysisResult = {
      mintedTokens: {
        fromJson: jsonTotalTokens,
        fromCsv: csvTotalTokens,
        match: jsonTotalTokens === csvTotalTokens,
      },
      totalAddresses: {
        fromJson: jsonTotalAddresses,
        fromCsv: csvTotalAddresses.size,
        match: jsonTotalAddresses === csvTotalAddresses.size,
      },
      fidComparison: {
        fidsInJsonNotInDb,
        fidsInDbNotInJson,
        totalFidsInJson: jsonFids.size,
        totalFidsInDb: dbFids.size,
      },
    };

    // Write results to a JSON file
    const outputPath = path.join(
      process.cwd(),
      "lib/song-1-bug/mint-analysis.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

    return NextResponse.json({
      success: true,
      message: "Analysis completed successfully",
      outputPath,
      result,
    });
  } catch (error) {
    console.error("Error in analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to perform analysis",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
