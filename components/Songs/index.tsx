"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Info, Disc } from "lucide-react";

interface ReleaseBlock {
  id: string;
  title: string;
  isLive: boolean;
  countdown?: number;
}

export default function SongsPage() {
  const [countdown, setCountdown] = useState(19330); // 05:22:10 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const releases: ReleaseBlock[] = [
    { id: "AT001", title: "PARADISE", isLive: true, countdown: countdown },
    { id: "AT002", title: "██████████", isLive: false },
    { id: "AT003", title: "██████████", isLive: false },
    { id: "AT004", title: "██████████", isLive: false },
    { id: "AT005", title: "██████████", isLive: false },
    { id: "AT006", title: "██████████", isLive: false },
    { id: "AT007", title: "██████████", isLive: false },
    { id: "AT008", title: "██████████", isLive: false },
    { id: "AT009", title: "██████████", isLive: false },
    { id: "AT010", title: "██████████", isLive: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ACID TEST</h1>
        <div className="flex space-x-2">
          <Link href="/songs">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-lg border-2 border-white/60 bg-black hover:bg-white/10"
            >
              <Disc className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-lg border-2 border-white/60 bg-black hover:bg-white/10"
            >
              <Info className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Release Blocks */}
      <div className="w-full max-w-md space-y-4">
        {releases.map((release) =>
          release.isLive ? (
            <Link
              href={`/songs/${release.id.toLowerCase()}`}
              key={release.id}
            >
              <div className="border-2 border-white/20 rounded-lg p-4 hover:bg-white/5 transition-colors h-[132px]">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-black border-2 border-white/40 rounded-lg relative flex-shrink-0 my-1">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold">{release.title}</h2>
                        <p className="text-sm text-white/60">{release.id}</p>
                      </div>
                      <div className="font-mono text-sm">
                        {formatCountdown(countdown)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm">Mint Open</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div
              key={release.id}
              className="border-2 border-white/10 rounded-lg p-4 opacity-50 h-[132px]"
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-black border-2 border-white/20 rounded-lg relative flex-shrink-0 my-1">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold font-mono">
                      {release.title}
                    </h2>
                    <p className="text-sm text-white/40">{release.id}</p>
                  </div>
                  <p className="text-sm text-white/40 italic mt-2">
                    coming soon...
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
