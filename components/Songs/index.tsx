"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useReadContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { SongMetadata } from "@/types";
import { fetchWithIPFSFallback, formatSongId } from "@/lib/utils";
import QuestionMark from "@/public/images/question_mark.png";
import { Header } from "../ui/header";
import { trackEvent } from "@/lib/posthog/client";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";

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

interface ReleaseBlock {
  index: number;
  id: string;
  title: string;
  status: "live" | "end" | "coming" | "redacted";
  countdown: number;
  image: string;
  salesStartDate: number;
}

export default function SongsPage() {
  const [releases, setReleases] = useState<ReleaseBlock[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [redactedSongs, setRedactedSongs] = useState<RedactedSong[]>([]);
  const { type: contextType, context } = useMiniAppContext();

  const userFid =
    contextType === ContextType.Farcaster ? context.user.fid : undefined;

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "00:00:00:00";

    const days = Math.floor(seconds / (3600 * 24));
    const totalHours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${days.toString().padStart(2, "0")}:${totalHours
      .toString()
      .padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTokenInfosResult = useReadContract({
    abi: AcidTestABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokenInfos",
    args: [BigInt(1), BigInt(20)],
  });

  // Fetch redacted songs from the database
  useEffect(() => {
    const fetchRedactedSongs = async () => {
      try {
        const response = await fetch("/api/redacted-songs");
        if (response.ok) {
          const data = await response.json();
          setRedactedSongs(data);
        }
      } catch (error) {
        console.error("Error fetching redacted songs:", error);
      }
    };

    fetchRedactedSongs();
  }, []);

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

          // Add redacted song placeholders to the releases list
          redactedSongs.forEach((redactedSong, i) => {
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
  }, [getTokenInfosResult.data, redactedSongs]);

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

  const renderReleaseBlock = (release: ReleaseBlock) => {
    if (release.status === "live") {
      return (
        <Link
          href={`/songs/${release.index}`}
          key={release.id}
          className="w-full"
          onClick={() => {
            trackEvent("song_clicked", {
              fid: userFid,
              songId: release.id,
              songTitle: release.title,
              songStatus: "live",
            });
          }}
        >
          <div className="border border-white/50 rounded-[8px] p-4 hover:bg-[#463B3A66] transition-colors w-full">
            <div className="flex gap-4 relative">
              <div className="w-20 h-20 bg-black border border-white/60 rounded relative flex-shrink-0 overflow-hidden">
                {release.image ? (
                  <Image
                    src={release.image}
                    alt={release.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[18px] text-mono leading-none">
                    {release.title.toUpperCase()}
                  </h2>
                  <p className="text-[14px] text-white leading-none">
                    {release.id}
                  </p>
                </div>
                <div className="flex justify-between items-end w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                    <span className="text-[14px] leading-none">Mint Open</span>
                  </div>
                  <div className="font-mono text-[10px] leading-none">
                    {release.countdown !== undefined &&
                      formatCountdown(release.countdown)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    } else if (release.status === "redacted") {
      return (
        <div
          key={release.id}
          className="w-full border border-white/20 opacity-50 rounded-lg p-4 bg-black/60"
        >
          <div className="flex gap-4 relative">
            <div className="w-20 h-20 bg-black border border-white/10 rounded relative flex-shrink-0 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={QuestionMark}
                  alt={"Redacted"}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl text-mono leading-none bg-white/60 text-transparent select-none rounded-[1px] w-[100%]">
                  _
                </h2>
                <p className="text-[14px] text-white leading-none">
                  {release.id}
                </p>
              </div>
              <div className="flex items-center gap-2 text-white/40">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-[14px] leading-none">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (release.status === "coming") {
      return (
        <div className="border border-white/50 rounded-[8px] p-4 w-full">
          <div className="flex gap-4 relative">
            <div className="w-20 h-20 bg-black border border-white/60 rounded relative overflow-hidden">
              {release.image ? (
                <Image
                  src={release.image}
                  alt={release.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
              <div className="flex flex-col gap-2">
                <h2 className="text-[18px] text-mono leading-none">
                  {release.title.toUpperCase()}
                </h2>
                <p className="text-[14px] text-white/40 leading-none">
                  {release.id}
                </p>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <p className="text-[14px] leading-none">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <Link
          href={`/songs/${release.index}`}
          key={release.id}
          className="w-full"
          onClick={() => {
            trackEvent("song_clicked", {
              fid: userFid,
              song_id: release.id,
              song_title: release.title,
              song_status: "ended",
            });
          }}
        >
          <div className="border border-white/50 rounded-[8px] p-4 hover:bg-[#463B3A66] transition-colors w-full">
            <div className="flex gap-4 relative">
              <div className="w-20 h-20 bg-black border border-white/40 rounded relative flex-shrink-0 overflow-hidden">
                {release.image ? (
                  <Image
                    src={release.image}
                    alt={release.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-white/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
                <div className="flex flex-col gap-2">
                  <h2 className="text-[18px] text-mono leading-none">
                    {release.title.toUpperCase()}
                  </h2>
                  <p className="text-[14px] text-white/40 leading-none">
                    {release.id}
                  </p>
                </div>
                <div className="flex justify-between items-end w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-plum" />
                    <p className="text-[14px] leading-none">Mint Closed</p>
                  </div>
                  <div className="font-mono text-[10px] text-[#606075] leading-none">
                    now on secondary
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }
  };

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
                  <Skeleton className="w-20 h-20 bg-white/10 rounded-lg relative flex-shrink-0 " />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 bg-white/10 rounded w-2/3 mb-2" />
                    <Skeleton className="h-3 bg-white/10 rounded w-1/4 mb-4" />
                    <Skeleton className="h-3 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : releases.map(renderReleaseBlock)}
      </div>
    </div>
  );
}
