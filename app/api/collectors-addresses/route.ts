import { NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const MAX_BATCH_SIZE = 100;

interface Collector {
  userId: number;
  songId: number;
  amount: number;
  user: {
    fid: number;
    username: string;
    displayName: string;
    avatarUrl: string;
    walletAddress: string;
    notificationDetails: string;
    createdAt: string;
  };
}

interface NeynarUser {
  fid: number;
  verified_addresses: {
    eth_addresses: string[];
  };
}

interface NeynarResponse {
  users: NeynarUser[];
}

export async function GET() {
  try {
    // Read the collectors data
    const collectorsPath = path.join(
      process.cwd(),
      "lib/song-1-bug/db-collectors.json"
    );
    const collectorsData: Collector[] = JSON.parse(
      fs.readFileSync(collectorsPath, "utf-8")
    );

    // Extract unique FIDs
    const fids = Array.from(
      new Set(collectorsData.map((collector) => collector.user.fid))
    );
    console.log(`Processing ${fids.length} unique FIDs`);

    // Process FIDs in batches
    const results: Record<number, string[]> = {};

    for (let i = 0; i < fids.length; i += MAX_BATCH_SIZE) {
      const batch = fids.slice(i, i + MAX_BATCH_SIZE);
      const fidsString = batch.join(",");

      const response = await axios.get<NeynarResponse>(
        "https://api.neynar.com/v2/farcaster/user/bulk",
        {
          headers: {
            "x-api-key": NEYNAR_API_KEY,
          },
          params: {
            fids: fidsString,
          },
        }
      );

      // Store the addresses for each FID
      response.data.users.forEach((user) => {
        results[user.fid] = user.verified_addresses.eth_addresses;
      });

      // Add a small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Create a mapping of FID to amount from collectors data
    const fidToAmount: Record<number, number> = {};
    collectorsData.forEach((collector: any) => {
      fidToAmount[collector.user.fid] = collector.amount;
    });

    // Sort the results by amount
    const sortedResults = Object.entries(results)
      .sort(([fidA], [fidB]) => {
        const amountA = fidToAmount[parseInt(fidA)] || 0;
        const amountB = fidToAmount[parseInt(fidB)] || 0;
        return amountA - amountB;
      })
      .reduce((acc: Record<number, string[]>, [fid, addresses]) => {
        acc[parseInt(fid)] = addresses;
        return acc;
      }, {});

    // Write results to a JSON file
    const outputPath = path.join(
      process.cwd(),
      "lib/song-1-bug/collectors-addresses.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(sortedResults, null, 2));

    return NextResponse.json({
      success: true,
      message: "Addresses collected successfully",
      outputPath,
    });
  } catch (error) {
    console.error("Error collecting addresses:", error);
    return NextResponse.json(
      { error: "Failed to collect addresses" },
      { status: 500 }
    );
  }
}
