"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Info, Disc } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MintModal } from "@/components/mint-modal";
import { useAccount, useReadContract } from "wagmi";
import { usePathname } from "next/navigation";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";

interface Collector {
  address: string;
  quantity: number;
  displayName: string;
  profilePicture: string;
}

interface SongMetadata {
  name: string;
  image: string;
  animation_url: string;
  description: string;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ETH" | "USDC">("ETH");
  const [countdown, setCountdown] = useState(19330); // 05:22:10 in seconds
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekValue, setSeekValue] = useState(0); // New state for tracking slider position during dragging
  const [isDragging, setIsDragging] = useState(false); // Track whether user is dragging the slider
  const [usdPrice, setUsdPrice] = useState(0);
  const [ethUsd, setEthUsd] = useState(2325);

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
    const interval = setInterval(fetchEthPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  const { address } = useAccount();

  // Extract token ID from the URL path
  const pathname = usePathname();
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

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!getTokenInfoResult.data?.uri) return;
      try {
        setUsdPrice(Number(getTokenInfoResult.data.usdPrice) / 10 ** 6);
        const response = await fetch(getTokenInfoResult.data.uri);
        const data: SongMetadata = await response.json();
        setMetadata(data);

        // Initialize audio
        const audio = new Audio(data.animation_url);
        audio.preload = "auto";
        audioRef.current = audio;

        audio.addEventListener("canplaythrough", () => {
          setIsLoading(false);
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
        });
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setIsLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [getTokenInfoResult.data]);

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

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
        setSeekValue(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioRef.current, isDragging]);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSliderValueChange = (value: number[]) => {
    // Update the seek value during dragging without changing audio position
    setSeekValue(value[0]);
    setIsDragging(true);
  };

  const handleSliderCommit = (value: number[]) => {
    const [newTime] = value;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    setIsDragging(false);
  };

  // Get the display time (either the seek position during drag, or current time)
  const displayTime = isDragging ? seekValue : currentTime;

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

      {/* CD Visualization */}
      <div className="w-full max-w-md aspect-square bg-black border-2 border-white/20 rounded-lg mb-6 relative">
        {metadata?.image && (
          <Image
            src={metadata.image}
            alt="Song artwork"
            fill
            className="object-cover rounded-lg opacity-60"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-3/4 h-3/4 rounded-full border-2 border-white/40 flex items-center justify-center ${
              isPlaying ? "animate-spin" : ""
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white/40" />
          </div>
        </div>
        <Button
          variant="outline"
          className="absolute bottom-4 right-4 w-16 h-16 border-2 bg-white text-black hover:bg-white/90 hover:text-black flex items-center justify-center p-0"
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-8 w-8 border-2 border-black rounded-full border-t-transparent" />
          ) : isPlaying ? (
            <Pause className="w-[40px] h-[40px] scale-[1.5] fill-current" />
          ) : (
            <Play className="w-[40px] h-[40px] scale-[1.5] fill-current" />
          )}
        </Button>
      </div>

      {/* Audio Controls */}
      <div className="w-full max-w-md space-y-2 mb-6">
        <Slider
          value={[isDragging ? seekValue : currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderValueChange}
          onValueCommit={handleSliderCommit}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-white/60">
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Song Title and Release Number */}
      <div className="w-full max-w-md text-center mb-8">
        <h2 className="text-xl font-bold">{metadata?.name || "PARADISE"}</h2>
        <div className="text-sm text-white/60">AT001</div>
        {metadata?.description && (
          <div className="text-sm text-white/60 mt-2">
            {metadata.description}
          </div>
        )}
      </div>

      {/* Mint Status and Controls */}
      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm">Mint Open</span>
          </div>
          <div className="text-sm font-mono">{formatCountdown(countdown)}</div>
        </div>

        <Button
          variant="outline"
          className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
          onClick={() => setIsMintModalOpen(true)}
        >
          MINT
        </Button>
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
