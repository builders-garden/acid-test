"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "../header";
import sdk from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatSongId } from "@/lib/utils";

interface TokenInfo {
  salesStartDate: number;
  salesExpirationDate: number;
  usdPrice: bigint;
  uri: string;
}

interface ReleaseBlock {
  index: number;
  id: string;
  title: string;
  status: "live" | "end" | "coming";
  countdown: number;
  image: string;
  salesStartDate: number;
}

export const handleAddFrame = () => {
  try {
    sdk.actions.addFrame();
  } catch (error) {
    console.error("Error adding frame:", error);
  }
};

export default function Home() {
  const { signIn, isLoading, isSignedIn, isAdmin } = useSignIn();
  const [liveSong, setLiveSong] = useState<ReleaseBlock | null>(null);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  const getTokenInfosResult = useReadContract({
    abi: AcidTestABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokenInfos",
    args: [BigInt(1), BigInt(20)],
  });

  useEffect(() => {
    if (getTokenInfosResult.data) {
      const allContractReleases =
        getTokenInfosResult.data as ReadonlyArray<TokenInfo>;
      const contractReleases = allContractReleases.filter(
        (release) => release.uri !== ""
      );

      const fetchReleasesData = async () => {
        setIsLoadingSongs(true);
        try {
          const releasesData = await Promise.all(
            contractReleases.map(async (release, i) => {
              const songId = i + 1;
              const songCid = release.uri.split("/").pop() || "";
              const now = Math.floor(Date.now() / 1000);

              // Regular song processing for all contract songs
              let title = formatSongId(songId);
              let image = "";

              try {
                const response = await fetch(release.uri);
                if (response.ok) {
                  const metadata = await response.json();
                  title = metadata.name || title;
                  image = metadata.image || "";
                }
              } catch (error) {
                console.error(
                  `Error fetching metadata for release ${songCid}:`,
                  error
                );
              }

              // Determine status based on timestamps
              let status: "live" | "end" | "coming";
              if (
                now >= release.salesStartDate &&
                now < release.salesExpirationDate
              ) {
                status = "live";
              } else if (now >= release.salesExpirationDate) {
                status = "end";
              } else {
                status = "coming";
              }

              return {
                index: songId,
                id: formatSongId(songId),
                title,
                status,
                countdown: release.salesExpirationDate - now,
                image,
                salesStartDate: release.salesStartDate,
              } as ReleaseBlock;
            })
          );

          const filteredReleases = releasesData.filter(
            (item): item is NonNullable<typeof item> => item !== null
          );

          // Find the first live song
          const firstLiveSong = filteredReleases.find(
            (song) => song.status === "live"
          );
          setLiveSong(firstLiveSong || null);
        } catch (error) {
          console.error("Error processing release data:", error);
        } finally {
          setIsLoadingSongs(false);
        }
      };

      fetchReleasesData();
    }
  }, [getTokenInfosResult.data]);

  return (
    <div className="relative min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/presave_bg.svg')`,
          backgroundSize: "85%",
          backgroundPosition: "center top -17px",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="z-20 w-full h-full">
        <Header />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
          <div className="flex flex-col items-center space-y-6 rounded-xl">
            <div className="text-center space-y-4 w-full">
              {!isSignedIn && (
                <Button
                  onClick={signIn}
                  disabled={isLoading}
                  className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              )}
            </div>

            {isSignedIn && (
              <div className="flex flex-col space-y-4 w-full">
                <Link
                  href={
                    liveSong
                      ? `/songs/${liveSong.index}`
                      : "https://acidtest.xyz/paper"
                  }
                  className="w-full"
                  target={liveSong ? "_self" : "_blank"}
                >
                  <Button
                    className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors"
                    disabled={isLoadingSongs}
                  >
                    {getTokenInfosResult.isLoading
                      ? ""
                      : isLoadingSongs
                      ? "Loading..."
                      : liveSong
                      ? "MINT"
                      : "ACIDPAPER"}
                  </Button>
                </Link>

                <Link
                  href="/"
                  className="w-full"
                >
                  <Button className="w-full h-10 text-lg bg-mint text-black hover:bg-plum transition-colors">
                    $ACID
                  </Button>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full"
                  >
                    <Button className="w-full h-10 text-lg bg-mint text-black hover:bg-plum transition-colors">
                      ADMIN PANEL
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
