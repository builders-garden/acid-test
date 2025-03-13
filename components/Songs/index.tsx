"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, EyeOff } from "lucide-react";
import { useReadContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { SongMetadata } from "@/types";
import { Header } from "../header";

interface TokenInfo {
  salesStartDate: number;
  salesExpirationDate: number;
  usdPrice: bigint;
  uri: string;
}

interface RedactedSong {
  tokenId: number;
  redactedUntil: number;
  title?: string;
}

interface ReleaseBlock {
  id: string;
  title: string;
  status: "live" | "end" | "coming" | "redacted";
  countdown: number;
  image: string;
  salesStartDate: number;
  redactedUntil?: number;
}

export default function SongsPage() {
  const [releases, setReleases] = useState<ReleaseBlock[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [redactedSongs, setRedactedSongs] = useState<RedactedSong[]>([]);

  console.log("releases", releases);
  console.log("redactedSongs", redactedSongs);

  const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "00:00:00";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (days > 0) {
      return `${days.toString().padStart(2, "0")}:${hours
        .toString()
        .padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
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
      const contractReleases =
        getTokenInfosResult.data as ReadonlyArray<TokenInfo>;

      console.log("contractReleases", contractReleases);

      const fetchReleasesData = async () => {
        setMetadataLoading(true);
        try {
          const releasesData = await Promise.all(
            contractReleases.map(async (release, i) => {
              console.log("release", release);
              if (release.uri === "") {
                return null;
              }

              const tokenId = i + 1;
              const now = Math.floor(Date.now() / 1000);

              // Check if this song is redacted
              const redactedSong = redactedSongs.find(
                (song) => song.tokenId === tokenId
              );
              const isRedacted =
                redactedSong && now < redactedSong.redactedUntil;

              // If song is redacted, use minimal information
              if (isRedacted) {
                return {
                  id: String(tokenId),
                  title: "Redacted Release",
                  status: "redacted" as const,
                  countdown: redactedSong.redactedUntil - now,
                  image: "",
                  salesStartDate: release.salesStartDate,
                  redactedUntil: redactedSong.redactedUntil,
                };
              }

              // Regular song processing
              let title = `Release ${tokenId}`;
              let image = "";

              try {
                const response = await fetch(release.uri);
                if (response.ok) {
                  const metadata = (await response.json()) as SongMetadata;
                  title = metadata.name || title;
                  image = metadata.image || "";
                }
              } catch (error) {
                console.error(
                  `Error fetching metadata for release ${tokenId}:`,
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
                id: String(tokenId),
                title,
                status,
                countdown: release.salesExpirationDate - now,
                image,
                salesStartDate: release.salesStartDate,
              };
            })
          );

          const filteredReleases = releasesData.filter(
            (item): item is NonNullable<typeof item> => item !== null
          );

          // Sort releases: live first, coming second, redacted third, ended last
          // Within each group, sort by salesStartDate (newest first)
          const sortedReleases = filteredReleases.sort((a, b) => {
            // First sort by status priority
            const statusPriority = { live: 0, coming: 1, redacted: 2, end: 3 };
            const statusDiff =
              statusPriority[a.status] - statusPriority[b.status];

            if (statusDiff !== 0) return statusDiff;

            // Then sort by salesStartDate (newest first)
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
          href={`/songs/${release.id.toLowerCase()}`}
          key={release.id}
          className="w-full"
        >
          {/* Existing Live Block UI */}
          <div className="border-2 border-white/20 rounded-lg p-4 hover:bg-white/5 transition-colors w-full">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-black border-2 border-white/40 rounded-lg relative flex-shrink-0 my-1 overflow-hidden">
                {release.image ? (
                  <Image
                    src={release.image}
                    alt={release.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/40" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold truncate">
                    {release.title}
                  </h2>
                  <p className="text-sm text-white/60">Release {release.id}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm">Mint Open</span>
                  </div>
                  <div className="font-mono text-sm">
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
      // Redacted songs - not clickable
      return (
        <div
          key={release.id}
          className="w-full border-2 border-white/20 rounded-lg p-4 bg-black/60 cursor-not-allowed"
        >
          <div className="flex items-start gap-4 relative">
            <div className="w-20 h-20 bg-black border-2 border-white/10 rounded-lg relative flex-shrink-0 my-1 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <EyeOff className="w-8 h-8 text-white/30" />
              </div>
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <div className="space-y-1">
                <h2 className="text-sm font-bold truncate">REDACTED</h2>
                <p className="text-sm text-white/60">Release {release.id}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <EyeOff
                    size={14}
                    className="text-white/60"
                  />
                  <span className="text-sm text-white/60">Details hidden</span>
                </div>
                <div className="font-mono text-sm">
                  {release.redactedUntil &&
                    formatCountdown(
                      release.redactedUntil - Math.floor(Date.now() / 1000)
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (release.status === "coming") {
      return (
        <Link
          href={`/songs/${release.id.toLowerCase()}`}
          key={release.id}
          className="w-full"
        >
          {/* Existing Coming Soon Block UI */}
          <div className="border-2 border-white/20 rounded-lg p-4 opacity-70 relative overflow-hidden hover:bg-white/5 transition-colors w-full">
            <div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-pulse"
              style={{ opacity: 0.3 }}
            ></div>

            <div className="flex items-start gap-4 relative z-10">
              <div className="w-20 h-20 bg-black border-2 border-white/20 rounded-lg relative flex-shrink-0 my-1 overflow-hidden">
                {release.image ? (
                  <Image
                    src={release.image}
                    alt={release.title}
                    fill
                    className="object-cover opacity-60"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold truncate">
                    {release.title}
                  </h2>
                  <p className="text-sm text-white/40">Release {release.id}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-white/60">
                  <Clock
                    size={14}
                    className="animate-pulse"
                  />
                  <p className="text-sm italic">coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    } else {
      return (
        <Link
          href={`/songs/${release.id.toLowerCase()}`}
          key={release.id}
          className="w-full"
        >
          {/* Existing Ended Block UI */}
          <div className="border-2 border-white/10 rounded-lg p-4 opacity-50 hover:bg-white/5 transition-colors w-full">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-black border-2 border-white/20 rounded-lg relative flex-shrink-0 my-1 overflow-hidden">
                {release.image ? (
                  <Image
                    src={release.image}
                    alt={release.title}
                    fill
                    className="object-cover opacity-50"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold truncate">
                    {release.title}
                  </h2>
                  <p className="text-sm text-white/40">Release {release.id}</p>
                </div>
                <p className="text-sm text-white/40 italic mt-4">mint ended</p>
              </div>
            </div>
          </div>
        </Link>
      );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      <Header />

      {/* Release Blocks */}
      <div className="flex flex-col w-full max-w-md space-y-4">
        {metadataLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`loading-${i}`}
                className="border-2 border-white/20 rounded-lg p-4 h-[124px] w-full"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="w-20 h-20 bg-white/10 rounded-lg relative flex-shrink-0 my-1" />
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
