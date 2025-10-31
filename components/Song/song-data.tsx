import React from "react";

interface SongDataProps {
  totalMints: number;
  totalCollectors: number;
  usdPrice: number;
  isLoading?: boolean;
}

export function SongData({
  totalMints,
  totalCollectors,
  usdPrice,
  isLoading = false,
}: SongDataProps) {
  const totalEarned = totalMints * usdPrice;

  return (
    <div className="w-full max-w-lg border border-white/20 bg-white/10 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-bold">
            {isLoading ? "..." : totalMints}
          </span>
          <span className="text-sm">MINTS</span>
        </div>

        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-bold">
            {isLoading ? "..." : totalCollectors}
          </span>
          <span className="text-sm">COLLECTORS</span>
        </div>

        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-bold">
            {isLoading ? "..." : `$${totalEarned.toFixed(0)}`}
          </span>
          <span className="text-sm">EARNED</span>
        </div>
      </div>
    </div>
  );
}
