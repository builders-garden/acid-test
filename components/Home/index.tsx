"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import {
  formatSongId,
  fetchWithIPFSFallback,
  viewAcidToken,
} from "@/lib/utils";
import { SongMetadata } from "@/types";
import { usePrelaunchState } from "@/hooks/use-prelaunch-state";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "../ui/loading-screen";
import { Header } from "../ui/header";
import sdk from "@farcaster/miniapp-sdk";
import { useSearchParams } from "next/navigation";

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

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromInternalNav = searchParams.get("from") === "internal";
  const { isAdmin } = useSignIn();
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const { isPrelaunch, isLoading: isPrelaunchLoading } = usePrelaunchState();
  const [isPageLoading, setIsPageLoading] = useState(true);

  const getTokenInfosResult = useReadContract({
    abi: AcidTestABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokenInfos",
    args: [BigInt(1), BigInt(20)],
  });

  useEffect(() => {
    if (!isPrelaunchLoading && isPrelaunch) {
      setIsLoadingSongs(false);
      setIsPageLoading(false);
      return;
    }
    if (getTokenInfosResult.data && !isPrelaunch && !isPrelaunchLoading) {
      const allContractReleases =
        getTokenInfosResult.data as ReadonlyArray<TokenInfo>;
      const contractReleases = allContractReleases.filter(
        (release) => release.uri !== ""
      );

      const fetchReleasesData = async () => {
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
                const metadata = await fetchWithIPFSFallback<SongMetadata>(
                  release.uri
                );
                title = metadata.name || title;
                image = metadata.image || "";
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

          // Only check for redirect if not coming from internal navigation
          // if (!fromInternalNav) {
          const liveSongs = filteredReleases.filter(
            (song) => song.status === "live"
          );

          // If there are multiple live songs, select the one with the latest salesStartDate
          const latestLiveSong =
            liveSongs.length > 0
              ? liveSongs.reduce(
                  (latest, current) =>
                    current.salesStartDate > latest.salesStartDate
                      ? current
                      : latest,
                  liveSongs[0]
                )
              : null;

          if (latestLiveSong) {
            router.push(`/songs/${latestLiveSong.index}`);
            return;
          }
          // }

          setIsLoadingSongs(false);
          setIsPageLoading(false);
        } catch (error) {
          console.error("Error processing release data:", error);
          setIsLoadingSongs(false);
          setIsPageLoading(false);
        }
      };

      fetchReleasesData();
    } else if (
      !isPrelaunchLoading &&
      !getTokenInfosResult.data &&
      getTokenInfosResult.isFetched
    ) {
      setIsLoadingSongs(false);
      setIsPageLoading(false);
    }
  }, [
    getTokenInfosResult.data,
    getTokenInfosResult.isFetched,
    isPrelaunch,
    isPrelaunchLoading,
    router,
    fromInternalNav,
  ]);

  // Show loader while checking initial states
  if (isPrelaunchLoading || isLoadingSongs) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/presave_bg.svg')`,
          backgroundSize: "64%",
          backgroundPosition: "center center", // Changed from "center top -17px" to center the background
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="z-20 w-full h-full">
        <Header />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4">
          <div className="flex flex-col items-center space-y-6 rounded-xl">
            <div className="flex flex-col space-y-4 w-full">
              {isPrelaunch ? (
                <Button
                  onClick={() =>
                    sdk.actions.openUrl(
                      "https://bafybeiagxkucxpfudahtxd7gokgkvp5kdorfq57g7pt6uzqyi2xyuzjpbe.ipfs.dweb.link/#x-ipfs-companion-no-redirect"
                    )
                  }
                  className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors"
                >
                  ACIDPAPER
                </Button>
              ) : (
                <Link
                  href={`/songs`}
                  className="w-full"
                  target={"_self"}
                >
                  <Button className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors">
                    RELEASES
                  </Button>
                </Link>
              )}

              <Button
                onClick={viewAcidToken}
                className="w-full h-10 text-lg bg-mint text-black hover:bg-plum transition-colors"
              >
                $ACID
              </Button>

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
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm">
          © 2025 ACIDTEST
        </div>
      </div>
    </div>
  );
}
