"use client";

import Image from "next/image";
import dexscreener from "@/public/images/dexscreener_icon.svg";
import base from "@/public/images/base_icon.svg";
import candles from "@/public/images/candles_icon.svg";
import acid_test from "@/public/images/acid_test_sm_icon.svg";
import copy from "@/public/images/copy_icon.svg";
import { useState, useEffect } from "react";
import { copyToClipboard } from "@/lib/utils";
import { Header } from "../ui/header";
import sdk from "@farcaster/frame-sdk";

const AcidTest_CA = "0x3A1609CEbE67C1d303954B5fb907bEF36213034B";

interface DexScreenerData {
  marketCap: number;
  volume24h: number;
  liquidity: number;
}

export default function AboutPage() {
  const [showCopied, setShowCopied] = useState(false);
  const [marketData, setMarketData] = useState<DexScreenerData>({
    marketCap: 0,
    volume24h: 0,
    liquidity: 0,
  });

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${AcidTest_CA}`
        );
        const data = await response.json();

        // The first pair in the array is the one we want
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          console.log("Pair data:", pair); // Debug log
          setMarketData({
            marketCap: Number(pair.marketCap || 0),
            volume24h: Number(pair.volume?.h24 || 0),
            liquidity: Number(pair.liquidity?.usd || 0),
          });
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };

    fetchMarketData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    if (!num || isNaN(num)) return "$0";

    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full">
      <Header />

      <div className="flex flex-col w-full max-w-md gap-10 mt-4">
        {/* Main Description */}
        <div className="flex flex-col gap-4">
          <p className="text-md leading-relaxed">
            ACID TEST is a radio show bringing music, conversation and creative
            energy to Farcaster.
          </p>
        </div>

        {/* Token Info Box */}
        <div className="border border-white/50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-2">
              <Image
                src={acid_test}
                alt="acid_test_small_icon"
                width={24}
                height={24}
                className=""
              />
              <span className="text-xl">$ACID</span>
            </div>
            <div className="flex -mt-1">
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://dexscreener.com/base/0x71182a44ca67eb9492d6476222ac15a73c2bd32c"
                  )
                }
                className="p-1 rounded bg-black hover:bg-[#AD82CD4D] transition-colors"
              >
                <Image
                  src={dexscreener}
                  alt="Dexscreener"
                  width={24}
                  height={24}
                  className="rounded-sm"
                />
              </button>
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://www.clanker.world/clanker/0x2e210c2D0f1B513dbA97aeaaB1D7F9fF38D8AA36"
                  )
                }
                className="p-1 rounded bg-black hover:bg-[#AD82CD4D] transition-colors"
              >
                <Image
                  src={candles}
                  alt="Candles"
                  width={24}
                  height={24}
                  className="rounded-sm"
                />
              </button>
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://basescan.org/token/0x2e210c2D0f1B513dbA97aeaaB1D7F9fF38D8AA36"
                  )
                }
                className="p-1 rounded bg-black hover:bg-[#AD82CD4D] transition-colors"
              >
                <Image
                  src={base}
                  alt="Base"
                  width={24}
                  height={24}
                  className="rounded-sm"
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex text-sm items-center gap-2">
              <span className="text-white/60 text-[10.5px] flex items-center">
                CA:
              </span>
              <span className="text-md flex items-center">
                {`${AcidTest_CA?.slice(0, 8)}...${AcidTest_CA?.slice(
                  -6
                )}`.toLowerCase()}
              </span>
              <div className="relative flex items-center">
                <button
                  onClick={() => copyToClipboard(AcidTest_CA, setShowCopied)}
                  className="hover:opacity-70 transition-opacity w-6 h-6 mb-1 flex items-center justify-center"
                >
                  <Image
                    src={copy}
                    alt="Copy"
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                </button>
                {showCopied && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+4px)] bg-white text-black text-xs py-1 px-2 rounded animate-fadeInOut">
                    copied
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white/60 text-sm">MKT CAP</div>
                <div className="text-lg">
                  {formatNumber(marketData.marketCap)}
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm">24H VOL</div>
                <div className="text-lg">
                  {formatNumber(marketData.volume24h)}
                </div>
              </div>
              <div>
                <div className="text-white/60 text-sm">LIQ</div>
                <div className="text-lg">
                  {formatNumber(marketData.liquidity)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-mono mb-4">OFFICIAL LINKS</h2>
          <div className="grid grid-cols-2 gap-y-4 text-[14px]">
            <div className="space-y-4">
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://bafybeiagxkucxpfudahtxd7gokgkvp5kdorfq57g7pt6uzqyi2xyuzjpbe.ipfs.dweb.link/#x-ipfs-companion-no-redirect"
                  )
                }
                className="block text-white hover:text-white/80 no-underline"
              >
                ACIDPAPER
              </button>
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://opensea.io/collection/acid-test-4866928"
                  )
                }
                className="block text-white hover:text-white/80 no-underline"
              >
                OPENSEA
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    sdk.actions.openUrl(
                      "https://basescan.org/address/0x3ddfcf51d4d955fb8436699b8f30d9d9fe442038"
                    )
                  }
                  className="text-white hover:text-white/80 no-underline"
                >
                  BASESCAN
                </button>
                <span className="text-[10px] text-black bg-[#606075] px-1">
                  NFTS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    sdk.actions.openUrl(
                      "https://basescan.org/token/0x2e210c2D0f1B513dbA97aeaaB1D7F9fF38D8AA36"
                    )
                  }
                  className="text-white hover:text-white/80 no-underline"
                >
                  BASESCAN
                </button>
                <span className="text-[10px] text-black px-1 bg-[#606075]">
                  $ACID
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <button
                onClick={() =>
                  sdk.actions.openUrl("https://x.com/acid____test")
                }
                className="block text-white hover:text-white/80 no-underline"
              >
                TWITTER
              </button>
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://dexscreener.com/base/0x71182a44ca67eb9492d6476222ac15a73c2bd32c"
                  )
                }
                className="block text-white hover:text-white/80 no-underline"
              >
                DEXSCREENER
              </button>
              <button
                onClick={() =>
                  sdk.actions.openUrl(
                    "https://www.clanker.world/clanker/0x2e210c2D0f1B513dbA97aeaaB1D7F9fF38D8AA36"
                  )
                }
                className="block text-white hover:text-white/80 no-underline"
              >
                CLANKER
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
