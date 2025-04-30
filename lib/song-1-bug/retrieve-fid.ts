import fs from "fs";
import path from "path";
import csv from "csv-parser";

interface TransferEvent {
  address: string;
  amount: number;
}

interface AggregatedData {
  [address: string]: {
    amount: number;
    fid?: number;
    allFids?: number[];
  };
}

interface NeynarUser {
  object: string;
  fid: number;
  username: string;
  display_name: string;
  verifications: string[];
}

interface NeynarResponse {
  [address: string]: NeynarUser[];
}

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_API_URL =
  "https://api.neynar.com/v2/farcaster/user/bulk-by-address";

const fetchFIDs = async (
  addresses: string[]
): Promise<{ [address: string]: number[] }> => {
  if (!NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY environment variable is not set");
  }

  const url = new URL(NEYNAR_API_URL);
  url.searchParams.append("addresses", addresses.join(","));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": NEYNAR_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.statusText}`);
  }

  const data: NeynarResponse = await response.json();
  const fids: { [address: string]: number[] } = {};

  // Process each address in the response
  Object.entries(data).forEach(([address, users]) => {
    if (users && users.length > 0) {
      // Store all FIDs for this address
      fids[address.toLowerCase()] = users.map((user) => user.fid);
      console.log(
        `Address ${address} has FIDs: ${users
          .map((user) => user.fid)
          .join(", ")}`
      );
    }
  });

  return fids;
};

const processCsv = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const results: TransferEvent[] = [];
    const aggregatedData: AggregatedData = {};
    const csvPath = path.join(
      process.cwd(),
      "lib",
      "song-1-bug",
      "acid test-transfersingle.csv"
    );
    const outputPath = path.join(
      process.cwd(),
      "lib",
      "song-1-bug",
      "aggregated-mints-fid-3.json"
    );

    console.log("Reading CSV from:", csvPath);
    console.log("Will write output to:", outputPath);

    if (!fs.existsSync(csvPath)) {
      reject(new Error(`CSV file not found at ${csvPath}`));
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (data) => {
        if (data.to && data.value) {
          results.push({
            address: data.to.toLowerCase(),
            amount: parseInt(data.value, 10),
          });
        }
      })
      .on("end", async () => {
        try {
          // Aggregate amounts by address
          results.forEach(({ address, amount }) => {
            if (!aggregatedData[address]) {
              aggregatedData[address] = { amount: 0 };
            }
            aggregatedData[address].amount += amount;
          });

          // Get unique addresses
          const addresses = Object.keys(aggregatedData);
          const batchSize = 350;
          const fids: { [address: string]: number[] } = {};

          // Process addresses in batches
          for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize);
            console.log(`Fetching FIDs for batch ${i / batchSize + 1}...`);
            const batchFids = await fetchFIDs(batch);
            Object.assign(fids, batchFids);
          }

          // Add FIDs to aggregated data
          Object.keys(aggregatedData).forEach((address) => {
            const addressFids = fids[address];
            if (addressFids && addressFids.length > 0) {
              // Store all FIDs for this address
              aggregatedData[address].fid = addressFids[0]; // Keep the first FID as primary
              aggregatedData[address].allFids = addressFids; // Store all FIDs
            }
          });

          // Convert to array of entries and sort by amount
          const sortedEntries = Object.entries(aggregatedData)
            .sort(([, a], [, b]) => {
              // First sort by whether they have a FID (FIDs first)
              if (a.fid && !b.fid) return -1;
              if (!a.fid && b.fid) return 1;
              // Then sort by amount
              return b.amount - a.amount;
            })
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {} as AggregatedData);

          // Calculate total
          const total = Object.values(aggregatedData).reduce(
            (sum, { amount }) => sum + amount,
            0
          );

          // Add total to the output
          const outputData = {
            ...sortedEntries,
            total,
            totalAddresses: Object.keys(aggregatedData).length,
            addressesWithMultipleFids: Object.entries(sortedEntries)
              .filter(([_, entry]) => entry.allFids && entry.allFids.length > 1)
              .map(([address, entry]) => ({
                address,
                amount: entry.amount,
                fids: entry.allFids,
              })),
          };

          fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
          console.log(
            "Successfully wrote aggregated, sorted data with FIDs to:",
            outputPath
          );
          resolve();
        } catch (error) {
          console.error("Error processing data:", error);
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("Error reading CSV:", error);
        reject(error);
      });
  });
};

export default processCsv;
