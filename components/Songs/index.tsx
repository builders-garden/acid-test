"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { SongMetadata } from "@/types";
import {
  fetchWithIPFSFallback,
  formatSongId,
  getFallbackFeaturingDetails,
} from "@/lib/utils";
import { Header } from "../ui/header";
import { trackEvent } from "@/lib/posthog/client";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import { ReleaseBlockCard } from "./ReleaseBlockCard";

interface TokenInfo {
  salesStartDate: number;
  salesExpirationDate: number;
  usdPrice: bigint;
  uri: string;
}

interface RedactedSong {
  id: number;
  createdAt: number;
}

interface FeatUser {
  username: string;
  pfp: string;
  fid: number;
}

interface FeaturingDetails {
  users: FeatUser[];
  text?: string;
}

export interface ReleaseBlock {
  index: number;
  id: string;
  title: string;
  status: "live" | "end" | "coming" | "redacted";
  countdown: number;
  image: string;
  salesStartDate: number;
  totalMints?: number;
  feat?: FeaturingDetails;
}

interface SongSummary {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  feat: FeaturingDetails | null;
  totalMints: number;
}

interface SongsSummaryResponse {
  songs: SongSummary[];
  redactedSongs: RedactedSong[];
}

export default function SongsPage() {
  const [releases, setReleases] = useState<ReleaseBlock[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const { type: contextType, context } = useMiniAppContext();

  const userFid =
    contextType === ContextType.Farcaster ? context.user.fid : undefined;

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
        setMetadataLoading(true);
        try {
          // Fetch songs summary with all the data we need in one call
          const summaryResponse = await fetch("/api/songs/summary");
          const summaryData: SongsSummaryResponse =
            await summaryResponse.json();

          const releasesData = await Promise.all(
            contractReleases.map(async (release, i) => {
              const songId = i + 1;
              const songCid = release.uri.split("/").pop() || "";
              const now = Math.floor(Date.now() / 1000);

              // Get song data from summary
              const songData = summaryData.songs.find((s) => s.id === songId);

              // Regular song processing for all contract songs
              let title = songData?.title || formatSongId(songId);
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
                totalMints: songData?.totalMints,
                feat: songData?.feat ?? getFallbackFeaturingDetails(songId),
              } as ReleaseBlock;
            })
          );

          const filteredReleases = releasesData.filter(
            (item): item is NonNullable<typeof item> => item !== null
          );

          // Add redacted song placeholders to the releases list
          summaryData.redactedSongs.forEach((redactedSong, i) => {
            filteredReleases.push({
              id: formatSongId(contractReleases.length + i + 1),
              title: "REDACTED",
              status: "redacted" as const,
              countdown: 0, // No countdown for simple redacted placeholders
              image: "",
              salesStartDate: 0,
              index: i,
            });
          });

          // Sort releases by salesStartDate in descending order (newest first)
          const sortedReleases = filteredReleases.sort((a, b) => {
            // For redacted releases (which have salesStartDate = 0), place them at the end
            if (a.status === "redacted" && b.status !== "redacted") return 1;
            if (a.status !== "redacted" && b.status === "redacted") return -1;
            // Sort by salesStartDate in descending order
            return b.salesStartDate - a.salesStartDate;
          });

          setReleases(sortedReleases);
        } catch (error) {
          console.error("Error processing release data:", error);
        } finally {
          setMetadataLoading(false);
        }
      };

      fetchReleasesData();
    }
  }, [getTokenInfosResult.data]);

  useEffect(() => {
    if (releases.length === 0) return;

    const timer = setInterval(() => {
      setReleases((currentReleases) =>
        currentReleases.map((release) => ({
          ...release,
          countdown:
            release.countdown && release.countdown > 0
              ? release.countdown - 1
              : 0,
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [releases.length]);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 gap-6 flex flex-col items-center w-full">
      <Header />

      {/* Release Blocks */}
      <div className="flex flex-col w-full max-w-md space-y-4">
        {metadataLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="border border-white/20 rounded-lg p-4 h-[124px] w-full"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="w-20 h-20 bg-white/10 rounded-lg relative shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                    <Skeleton className="h-3 bg-white/10 rounded w-1/4 mb-4" />
                    <Skeleton className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : releases.map((release) => (
              <ReleaseBlockCard
                key={release.id}
                release={release}
                asLink={release.status === "live" || release.status === "end"}
                onClick={
                  release.status === "live"
                    ? () =>
                        trackEvent("song_clicked", {
                          fid: userFid,
                          songId: release.id,
                          songTitle: release.title,
                          songStatus: "live",
                        })
                    : release.status === "end"
                    ? () =>
                        trackEvent("song_clicked", {
                          fid: userFid,
                          song_id: release.id,
                          song_title: release.title,
                          song_status: "ended",
                        })
                    : undefined
                }
              />
            ))}
      </div>
    </div>
  );
}
