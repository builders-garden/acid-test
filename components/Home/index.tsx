"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatSongId, fetchWithIPFSFallback } from "@/lib/utils";
import { SongMetadata } from "@/types";
import { usePrelaunchState } from "@/hooks/use-prelaunch-state";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "../ui/loading-screen";
import { Header } from "../ui/header";

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
  const {
    signIn,
    isLoading: isSignInLoading,
    isSignedIn,
    isAdmin,
  } = useSignIn();
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const { isPrelaunch, isLoading: isPrelaunchLoading } = usePrelaunchState();

  const getTokenInfosResult = useReadContract({
    abi: AcidTestABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokenInfos",
    args: [BigInt(1), BigInt(20)],
  });

  useEffect(() => {
    if (isPrelaunch) {
      setIsLoadingSongs(false);
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

          // Find the first live song
          const firstLiveSong = filteredReleases.find(
            (song) => song.status === "live"
          );
          // Redirect to the first live song's page if there is one and we're not in prelaunch
          if (firstLiveSong) {
            router.push(`/songs/${firstLiveSong.index}`);
          }
        } catch (error) {
          console.error("Error processing release data:", error);
        } finally {
          setTimeout(() => setIsLoadingSongs(false), 500);
        }
      };

      fetchReleasesData();
    } else if (!getTokenInfosResult.data && getTokenInfosResult.isFetched) {
      setIsLoadingSongs(false);
    }
  }, [
    getTokenInfosResult.data,
    getTokenInfosResult.isFetched,
    isPrelaunch,
    isPrelaunchLoading,
    router,
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
            <div className="text-center space-y-4 w-full">
              {!isSignedIn && (
                <Button
                  onClick={signIn}
                  disabled={isSignInLoading}
                  className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors"
                >
                  {isSignInLoading ? "Signing in..." : "Sign in"}
                </Button>
              )}
            </div>

            {isSignedIn && (
              <div className="flex flex-col space-y-4 w-full">
                <Link
                  href={isPrelaunch ? "https://acidtest.xyz/paper" : `/songs`}
                  className="w-full"
                  target={!isPrelaunch ? "_self" : "_blank"}
                >
                  <Button className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors">
                    {isPrelaunch ? "ACIDPAPER" : "RELEASES"}
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

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm">
          © 2025 ACIDTEST
        </div>
      </div>
    </div>
  );
}
