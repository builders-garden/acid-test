import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

interface TransferResult {
  fid: number;
  addresses: {
    address: string;
    hasTransfer: boolean;
    transferAmount: number;
  }[];
  totalTransferAmount: number;
}

export async function GET() {
  try {
    // Read the addresses data
    const addressesPath = path.join(
      process.cwd(),
      "lib/song-1-bug/collectors-addresses.json"
    );
    const addressesData: Record<number, string[]> = JSON.parse(
      fs.readFileSync(addressesPath, "utf-8")
    );
    console.log(
      `Found ${
        Object.keys(addressesData).length
      } FIDs in collectors-addresses.json`
    );

    // Read the CSV file
    const csvPath = path.join(
      process.cwd(),
      "lib/song-1-bug/acid test-transfersingle.csv"
    );
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const records = parse(csvContent, {
      skip_empty_lines: true,
      relax_column_count: true,
    });
    console.log(`Found ${records.length - 1} transfer records in CSV`); // -1 for header

    // Create a mapping of addresses to their transfer amounts
    const transferData = new Map<string, number>();
    let totalTransfers = 0;
    records.slice(1).forEach((record: string[]) => {
      if (record.length >= 6) {
        // Ensure we have at least 6 columns
        const address = record[1].toLowerCase(); // to address
        const amount = parseFloat(record[5]); // value column (6th column, index 5)
        if (!isNaN(amount)) {
          transferData.set(address, amount);
          totalTransfers += amount;
        }
      }
    });
    console.log(`Created transfer map with ${transferData.size} entries`);
    console.log(`Total transfers from CSV: ${totalTransfers}`);

    // Verify all amounts from CSV
    console.log("First few transfer amounts from CSV:");
    records.slice(1, 6).forEach((record: string[]) => {
      console.log(`Address: ${record[1]}, Amount: ${record[5]}`);
    });

    const results: TransferResult[] = [];
    const resultsWithoutTransfers: TransferResult[] = [];
    let totalMatches = 0;

    // Process each FID
    for (const [fid, addresses] of Object.entries(addressesData)) {
      const fidNum = parseInt(fid);

      const addressResults = addresses.map((address) => {
        const hasTransfer = transferData.has(address.toLowerCase());
        if (hasTransfer) totalMatches++;
        return {
          address,
          hasTransfer,
          transferAmount: hasTransfer
            ? transferData.get(address.toLowerCase())!
            : 0,
        };
      });

      // Calculate total transfer amount for this FID
      const totalTransferAmount = addressResults.reduce(
        (sum, result) => sum + result.transferAmount,
        0
      );

      const result = {
        fid: fidNum,
        addresses: addressResults,
        totalTransferAmount,
      };

      // If no addresses have transfers, add to beginning of results
      if (!addressResults.some((result) => result.hasTransfer)) {
        resultsWithoutTransfers.push(result);
      } else {
        results.push(result);
      }
    }

    console.log(`Found ${totalMatches} matching addresses`);
    console.log(`Found ${results.length} FIDs with transfers`);
    console.log(
      `Found ${resultsWithoutTransfers.length} FIDs without transfers`
    );

    // Sort results by total transfer amount in descending order
    const sortedResults = results.sort(
      (a, b) => b.totalTransferAmount - a.totalTransferAmount
    );

    // Combine results: first FIDs without transfers, then sorted FIDs with transfers
    const finalResults = [...resultsWithoutTransfers, ...sortedResults];

    // Log first few results to verify
    console.log("First few results:");
    finalResults.slice(0, 5).forEach((result) => {
      console.log(
        `FID: ${result.fid}, Total Transfer Amount: ${
          result.totalTransferAmount
        }, Has Transfers: ${result.addresses.some((a) => a.hasTransfer)}`
      );
    });

    // Calculate total amount across all FIDs with transfers
    const totalAmountFromFIDs = sortedResults.reduce((sum, result) => {
      console.log(
        `FID ${result.fid} has ${result.addresses.length} addresses with total transfer amount: ${result.totalTransferAmount}`
      );
      return sum + result.totalTransferAmount;
    }, 0);
    console.log(`Total amount from FIDs: ${totalAmountFromFIDs}`);

    // Log detailed breakdown of FIDs with transfers
    console.log("\nDetailed breakdown of FIDs with transfers:");
    sortedResults.forEach((result) => {
      console.log(`\nFID: ${result.fid}`);
      console.log(`Total Transfer Amount: ${result.totalTransferAmount}`);
      console.log("Addresses:");
      result.addresses.forEach((addr) => {
        console.log(
          `  ${addr.address}: ${
            addr.hasTransfer ? addr.transferAmount : "No transfer"
          }`
        );
      });
    });

    // Calculate total amount from all transfer events in CSV
    const totalAmountFromTransfers = totalTransfers;
    console.log(`Total amount from transfers: ${totalAmountFromTransfers}`);

    // Verify the difference
    console.log(
      `\nDifference between total transfers and FID amounts: ${
        totalAmountFromTransfers - totalAmountFromFIDs
      }`
    );

    // Write results to a JSON file
    const outputPath = path.join(
      process.cwd(),
      "lib/song-1-bug/transfer-results.json"
    );
    const finalOutput = {
      summary: {
        totalAmountFromFIDs,
        totalAmountFromTransfers,
        totalChecked: finalResults.length,
        totalWithTransfers: results.length,
        totalWithoutTransfers: resultsWithoutTransfers.length,
        totalAddressMatches: totalMatches,
      },
      results: finalResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));

    return NextResponse.json({
      success: true,
      message: "Transfer checks completed successfully",
      outputPath,
      summary: finalOutput.summary,
    });
  } catch (error) {
    console.error("Error checking transfers:", error);
    return NextResponse.json(
      { error: "Failed to check transfers" },
      { status: 500 }
    );
  }
}
