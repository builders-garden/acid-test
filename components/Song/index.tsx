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

interface Collector {
  address: string;
  quantity: number;
  displayName: string;
  profilePicture: string;
}

const generateDummyCollectors = (count: number): Collector[] => {
  let currentQuantity = 3500; // Start with a high number
  return Array.from({ length: count }, (_, i) => {
    currentQuantity -= Math.floor(Math.random() * 50) + 1; // Decrease by 1-50 each time
    const collectorNumber = i + 4;
    return {
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random()
        .toString(16)
        .slice(2, 6)}`,
      displayName: `collector${collectorNumber}`,
      quantity: currentQuantity,
      profilePicture: `https://ui-avatars.com/api/?name=${collectorNumber}&background=random&size=32`,
    };
  });
};

const initialCollectors: Collector[] = [
  {
    address: "0x1234...5678",
    displayName: "nicholas",
    quantity: 3600,
    profilePicture:
      "https://ui-avatars.com/api/?name=N&background=random&size=32",
  },
  {
    address: "0x8765...4321",
    displayName: "dwr.eth",
    quantity: 3550,
    profilePicture:
      "https://ui-avatars.com/api/?name=D&background=random&size=32",
  },
  {
    address: "0x9876...5432",
    displayName: "chaim.eth",
    quantity: 3500,
    profilePicture:
      "https://ui-avatars.com/api/?name=C&background=random&size=32",
  },
  ...generateDummyCollectors(97),
];

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

  const sortedCollectors = useMemo(() => {
    const userCollector: Collector = {
      address: "0xYOUR...ADDRESS",
      displayName: "You",
      quantity: 2505,
      profilePicture:
        "https://ui-avatars.com/api/?name=Y&background=random&size=32",
    };
    const sortedList = [...initialCollectors, userCollector].sort(
      (a, b) => b.quantity - a.quantity
    );
    const userIndex = sortedList.findIndex((c) => c.displayName === "You");
    if (userIndex !== -1) {
      sortedList.splice(userIndex, 1);
    }
    sortedList.splice(41, 0, userCollector); // Insert "You" at position 42
    return sortedList;
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      <Header />

      {/* CD Visualization */}
      <div className="w-full max-w-md aspect-square bg-black border-2 border-white/20 rounded-lg mb-6 relative overflow-hidden">
        {/* Black background */}
        <div className="absolute inset-0 bg-zinc-800 opacity-50"></div>

        {/* Circular mask with rotating artwork */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-[90%] h-[90%] rounded-full overflow-hidden relative`}
          >
            {metadata?.image && (
              <div
                className="absolute inset-0"
                style={{
                  transform: `rotate(${
                    isCurrentSong && isPlaying ? rotation : 0
                  }deg)`,
                  transition: !isPlaying ? "transform 0.1s ease" : "none", // Smooth transition only when pausing
                }}
              >
                <Image
                  src={metadata.image}
                  alt="Song artwork"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* CD center hole */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-black z-10 border-[1px] border-white/40" />
            </div>
          </div>
        </div>

        {/* CD ring overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-5/6 h-5/6 rounded-full border-2 border-white/40 flex items-center justify-center" />
        </div>

        {/* Play/Pause button */}
        <Button
          variant="outline"
          className="absolute bottom-2 right-2 w-12 h-12 border-2 bg-white text-black hover:bg-white/90 hover:text-black flex items-center justify-center p-0"
          onClick={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-8 w-8 border-2 border-black rounded-full border-t-transparent" />
          ) : isCurrentSong && isPlaying ? (
            <Pause className="w-[40px] h-[40px] scale-[1.5] fill-current" />
          ) : (
            <Play className="w-[40px] h-[40px] scale-[1.5] fill-current" />
          )}
        </Button>
      </div>

      {/* Audio Controls */}
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
        <div className="flex justify-between text-xs text-white/60">
          <span>{isCurrentSong ? formatTime(displayTime) : "0:00"}</span>
          <span>{isCurrentSong ? formatTime(displayDuration) : "0:00"}</span>
        </div>
      </div>

      {/* Song Title and Release Number */}
      <div className="w-full max-w-md text-center mb-8">
        <h2 className="text-xl font-bold">{metadata?.name || "LOADING"}</h2>
        <div className="text-sm text-white/60">{formatSongId(tokenId)}</div>
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
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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
            variant="outline"
            className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
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
          {/* Signed-in user's collector spot at the top */}
          <div className="flex items-center justify-between border border-white/20 p-2 rounded bg-blue-500/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                42
              </div>
              <img
                src="https://ui-avatars.com/api/?name=Y&background=random&size=32"
                alt="Your profile"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span>You</span>
            </div>
            <a
              href={`https://opensea.io/assets/ethereum/0x123...456/${2505}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              2505
            </a>
          </div>
          {sortedCollectors.map((collector, i) => (
            <div
              key={collector.address}
              className="flex items-center justify-between p-2 rounded border border-white/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-xs">
                  {i + 1}
                </div>
                <img
                  src={collector.profilePicture || "/images/default_pfp.png"}
                  alt={`${collector.displayName} profile`}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span>{collector.displayName}</span>
              </div>
              <a
                href={`https://opensea.io/assets/ethereum/0x123...456/${collector.quantity}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {collector.quantity}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Mint Modal */}
      <MintModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        mintQuantity={mintQuantity}
        setMintQuantity={setMintQuantity}
        songName={metadata!.name}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        userAddress={address}
        tokenId={tokenId}
        usdPrice={usdPrice}
        ethUsd={ethUsd}
      />
    </div>
  );
}
