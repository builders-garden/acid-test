"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from "lucide-react";
import Image from "next/image";
import { MintModal } from "@/components/mint-modal";
import { useAccount, useReadContract } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { SongMetadata } from "@/types";
import { Header } from "../header";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatCountdown, formatSongId } from "@/lib/utils";
import { useCollectors } from "@/hooks/use-get-collectors";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

// Update the interface to match what's being returned from useCollectors
interface Collector {
  userId: number;
  amount: number;
  user?: {
    fid: number;
    username: string;
    username: string;
    avatarUrl: string | null;
    walletAddress: string | null;
  };
}

export default function Song() {
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ETH" | "USDC">("ETH");
  const [countdown, setCountdown] = useState(19330);
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"live" | "end">("live");
  const [isDragging, setIsDragging] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [usdPrice, setUsdPrice] = useState(0);
  const [ethUsd, setEthUsd] = useState(2325);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Use the global audio player context
  const {
    isPlaying,
    currentSong,
    play,
    pause,
    toggle,
    currentTime,
    duration,
    seek,
  } = useAudioPlayer();
  const { type: contextType, context } = useMiniAppContext();
  const { address } = useAccount();

  // Extract token ID from the URL path
  const pathname = usePathname();
  const router = useRouter();
  const tokenId = useMemo(() => {
    // Extract the last segment from the pathname
    const pathSegments = pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Try to parse as integer, default to 1 if not a valid number
    const parsedId = parseInt(lastSegment);
    return isNaN(parsedId) ? 1 : parsedId;
  }, [pathname]);

  const { collectors, isLoading: collectorsLoading } = useCollectors(tokenId);
  const [userFid, setUserFid] = useState<number | null>(null);

  useEffect(() => {
    if (contextType === "farcaster" && context?.user?.fid) {
      setUserFid(context.user.fid);
    }
  }, [context, contextType]);

  const getTokenInfoResult = useReadContract({
    abi: AcidTestABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokenInfo",
    args: [BigInt(tokenId)],
  });

  const ETH_PRICE_API =
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

  // Fetch ETH price on component mount
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch(ETH_PRICE_API);
        const data = await response.json();
        setEthUsd(data.ethereum.usd);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      }
    };

    fetchEthPrice();

    // Refresh price every 10 seconds
    const interval = setInterval(fetchEthPrice, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!getTokenInfoResult.data?.uri) return;
      try {
        setUsdPrice(Number(getTokenInfoResult.data.usdPrice) / 10 ** 6);

        // Determine status based on timestamps
        const now = Math.floor(Date.now() / 1000);
        const salesStartDate = Number(getTokenInfoResult.data.salesStartDate);
        const salesExpirationDate = Number(
          getTokenInfoResult.data.salesExpirationDate
        );

        let songStatus: "live" | "end";
        if (now >= salesStartDate && now < salesExpirationDate) {
          songStatus = "live";
        } else {
          songStatus = "end";
        }

        // If the song hasn't started yet, redirect to songs page
        if (now < salesStartDate) {
          router.push("/songs");
          return;
        }

        setStatus(songStatus);

        // Only set countdown for live status
        if (songStatus === "live") {
          setCountdown(salesExpirationDate - now);
        }

        // Rest of the metadata fetching...
        const response = await fetch(getTokenInfoResult.data.uri);
        const data: SongMetadata = await response.json();
        setMetadata(data);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [getTokenInfoResult.data, router]);

  // Countdown timer effect
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

  // Handle CD spinning animation based on global playback state
  useEffect(() => {
    const isCurrentSong = currentSong.tokenId === tokenId;

    if (isPlaying && isCurrentSong) {
      animationRef.current = requestAnimationFrame(animateSpin);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentSong.tokenId, tokenId]);

  // Function to handle CD spinning animation
  const animateSpin = () => {
    rotationRef.current = (rotationRef.current + 0.5) % 360; // Slower rotation (0.5 degree per frame)
    setRotation(rotationRef.current);
    animationRef.current = requestAnimationFrame(animateSpin);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSliderValueChange = (value: number[]) => {
    setSeekValue(value[0]);
    setIsDragging(true);
  };

  const handleSliderCommit = (value: number[]) => {
    const [newTime] = value;
    seek(newTime);
    setIsDragging(false);
  };

  const handlePlayPause = () => {
    if (isLoading || !metadata) return;

    if (isPlaying && currentSong.tokenId === tokenId) {
      pause();
    } else {
      play(metadata, tokenId);
    }
  };

  // Check if this is the currently playing song
  const isCurrentSong = currentSong.tokenId === tokenId;

  // Get the display time (either the seek position during drag, or current time)
  const displayTime = isDragging ? seekValue : isCurrentSong ? currentTime : 0;
  const displayDuration = isCurrentSong ? duration : 0;

  // Replace the sortedCollectors useMemo with one that uses the real collectors data
  const sortedCollectors = useMemo(() => {
    if (collectorsLoading || !collectors) {
      return [];
    }

    // Sort collectors by amount
    return [...collectors].sort((a, b) => b.amount - a.amount);
  }, [collectors, collectorsLoading]);

  // Get the user's position in the list using FID directly
  const userPosition = useMemo(() => {
    if (!userFid || !collectors) return null;

    // Find the user's position directly by FID
    const index = sortedCollectors.findIndex((c) => c.user?.fid === userFid);
    return index !== -1 ? index + 1 : null;
  }, [userFid, sortedCollectors, collectors]);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full">
      <Header />

      {/* CD Visualization */}
      <div className="w-full max-w-lg aspect-square bg-black border border-white/80 rounded-lg mb-6 relative overflow-hidden">
        {metadata?.image && (
          <div className="absolute inset-0">
            <Image
              src={metadata.image}
              alt="Song artwork"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Play/Pause button */}
        <Button
          className={`absolute bottom-4 right-4 w-14 h-14 ${
            !isPlaying
              ? "bg-mint text-black hover:hover:bg-plum"
              : "bg-plum text-black hover:bg-plum/90"
          } flex items-center justify-center p-0`}
          onClick={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-8 w-8 border-2 border-black rounded-full border-t-transparent" />
          ) : isCurrentSong && isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current" />
          )}
        </Button>
      </div>

      {/* Audio Controls */}
      {isPlaying && (
        <div className="w-full max-w-md space-y-2 mb-6">
          <Slider
            value={[isCurrentSong ? displayTime : 0]}
            max={isCurrentSong ? displayDuration || 100 : 100}
            step={0.1}
            onValueChange={handleSliderValueChange}
            onValueCommit={handleSliderCommit}
            className="cursor-pointer"
            disabled={!isCurrentSong}
          />
          <div className="flex justify-between text-xs text-white">
            <span>{isCurrentSong ? formatTime(displayTime) : "0:00"}</span>
            <span>{isCurrentSong ? formatTime(displayDuration) : "0:00"}</span>
          </div>
        </div>
      )}

      {/* Song Title and Release Number */}
      <div className="w-full max-w-md text-center mb-8">
        <h2 className="text-xl font-bold">{metadata?.name || "LOADING"}</h2>
        <div className="text-md text-white">{formatSongId(tokenId)}</div>
        {/* {metadata?.description && (
          <div className="text-sm text-white/60 mt-2">
            {metadata.description}
          </div>
        )} */}
      </div>

      {/* Mint Status and Controls - Dynamically adjust based on status */}
      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            {status === "live" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
                <span className="text-sm">Mint Open</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-sm">Mint Ended</span>
              </>
            )}
          </div>
          {status === "live" && (
            <div className="text-sm font-mono">
              {formatCountdown(countdown)}
            </div>
          )}
        </div>

        {status === "live" ? (
          <Button
            className="w-full h-10 text-lg bg-mint  text-black hover:bg-plum hover:text-black"
            onClick={() => setIsMintModalOpen(true)}
          >
            MINT
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 text-lg border-2 border-white/60 bg-transparent text-white hover:bg-white/20"
            onClick={() =>
              window.open(
                `https://opensea.io/collection/acid-test-${tokenId}`,
                "_blank"
              )
            }
          >
            VIEW ON OPENSEA
          </Button>
        )}
      </div>

      {/* Collectors */}
      <div className="w-full max-w-md">
        <h2 className="text-lg mb-3 font-bold">COLLECTORS</h2>
        <div className="space-y-2">
          {/* Show loading state when collectors are being fetched */}
          {collectorsLoading ? (
            <div className="text-center py-4">Loading collectors...</div>
          ) : (
            <>
              {/* Signed-in user's collector spot if they're in the list and have FID */}
              {userFid && userPosition && (
                <div className="flex items-center justify-between border border-white/90 p-2 rounded bg-[#FFFFFF33]/20">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">
                      {userPosition}
                    </div>
                    <Image
                      src={
                        collectors?.find((c) => c.user?.fid === userFid)?.user
                          ?.avatarUrl ||
                        `https://ui-avatars.com/api/?name=You&background=random&size=32`
                      }
                      alt="Your profile"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span>You</span>
                  </div>
                  <span className="hover:underline">
                    {collectors?.find((c) => c.user?.fid === userFid)?.amount ||
                      0}
                  </span>
                </div>
              )}

              {/* Display all collectors - also update the condition to use FID */}
              {sortedCollectors.map((collector, i) => {
                return (
                  <div
                    key={collector.userId}
                    className="flex items-center justify-between p-2 rounded border border-white/100"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">
                        {i + 1}
                      </div>
                      <Image
                        src={
                          collector.user?.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${
                            collector.user?.username || "User"
                          }&background=random&size=32`
                        }
                        alt={`${collector.user?.username || "User"} profile`}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span>
                        {collector.user?.username ||
                          collector.user?.username ||
                          `User ${collector.userId}`}
                      </span>
                    </div>
                    <a
                      href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {collector.amount}
                    </a>
                  </div>
                );
              })}

              {/* Show message if no collectors */}
              {sortedCollectors.length === 0 && (
                <div className="text-center py-4">No collectors yet</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mint Modal */}
      {metadata && (
        <MintModal
          isOpen={isMintModalOpen}
          onClose={() => setIsMintModalOpen(false)}
          mintQuantity={mintQuantity}
          setMintQuantity={setMintQuantity}
          songName={metadata.name}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          userAddress={address}
          tokenId={tokenId}
          usdPrice={usdPrice}
          ethUsd={ethUsd}
          image={metadata?.image}
        />
      )}
    </div>
  );
}
