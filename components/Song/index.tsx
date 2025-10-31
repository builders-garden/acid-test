"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { MintModal } from "@/components/Song/mint-modal";
import { PlayerControls } from "./player-controls";
import { MintStatus } from "./mint-status";
import { CollectorsSection } from "./collectors-section";
import { SongData } from "./song-data";
import { SongDescription } from "./song-description";
import { Feat } from "../ui/feat";

import { useAccount, useReadContract } from "wagmi";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import {
  useCollectors,
  useUserCollector,
  useTotalMints,
} from "@/hooks/use-get-collectors";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { fetchWithIPFSFallback } from "@/lib/utils";
import { useFeaturingDetails } from "@/hooks/use-featuring-details";
import { SongMetadata } from "@/types";
import sdk from "@farcaster/frame-sdk";
import Image from "next/image";
import { Header } from "../ui/header";
import { trackEvent } from "@/lib/posthog/client";
import { TitleAndLinks } from "./title-and-links";
import { ChevronUp } from "lucide-react";

export default function Song() {
  // Get pathname and set up router
  const pathname = usePathname();
  const router = useRouter();

  // Extract token ID from URL path
  const tokenId = useMemo(() => {
    const pathSegments = pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    const parsedId = parseInt(lastSegment);
    return isNaN(parsedId) ? 1 : parsedId;
  }, [pathname]);

  // Get song data and featuring details from API
  const { data: featuringResponse, isLoading: featuringLoading } =
    useFeaturingDetails(tokenId);

  // Get featuring details from the API response with built-in fallback
  const featuringDetails = useMemo(() => {
    return featuringResponse?.data;
  }, [featuringResponse?.data]);

  // State management
  const [mintQuantity, setMintQuantity] = useState(1);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"USDC" | "ETH">("USDC");
  const [countdown, setCountdown] = useState(19330);
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"live" | "end">("live");
  const [isDragging, setIsDragging] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [usdPrice, setUsdPrice] = useState(0);
  const [ethUsd, setEthUsd] = useState(2325);
  const [userFid, setUserFid] = useState<number | null>(null);
  const [songDuration, setSongDuration] = useState(0);
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false);

  // Hooks
  const {
    isPlaying,
    currentSong,
    play,
    pause,
    currentTime,
    duration,
    seek,
    preloadSong,
  } = useAudioPlayer();
  const { type: contextType, context } = useMiniAppContext();
  const { address } = useAccount();

  const {
    collectors,
    isLoading: collectorsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchCollectors,
    total: totalCollectors,
  } = useCollectors(tokenId);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTopButton(true);
      } else {
        setShowScrollToTopButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Contract interaction
  const getTokenInfoResult = useReadContract({
    abi: AcidTestABI,
    address: CONTRACT_ADDRESS,
    functionName: "getTokenInfo",
    args: [BigInt(tokenId)],
  });

  // Set user FID from context
  useEffect(() => {
    if (contextType === "farcaster" && context?.user?.fid) {
      setUserFid(context.user.fid);
    }
  }, [context, contextType]);

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const { data } = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
          {
            timeout: 5000, // 5 seconds timeout
          }
        );
        setEthUsd(data.ethereum.usd);
      } catch (error) {
        console.error("Error fetching ETH price:", error);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 20000);
    return () => clearInterval(interval);
  }, []);

  // Fetch metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!getTokenInfoResult.data?.uri) return;
      try {
        setUsdPrice(Number(getTokenInfoResult.data.usdPrice) / 10 ** 6);

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

        if (now < salesStartDate) {
          router.push("/songs");
          return;
        }

        setStatus(songStatus);

        if (songStatus === "live") {
          setCountdown(salesExpirationDate - now);
        }

        const data = await fetchWithIPFSFallback<SongMetadata>(
          getTokenInfoResult.data.uri
        );
        setMetadata(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching metadata:", error);
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [getTokenInfoResult.data, router]);

  // Derived state
  const isCurrentSong = currentSong.tokenId === tokenId;
  const displayTime = isDragging ? seekValue : isCurrentSong ? currentTime : 0;
  // Always show duration for the current page's song, whether it's playing or not
  const displayDuration = isCurrentSong ? duration : songDuration;

  // Preload the song audio when metadata is loaded
  useEffect(() => {
    if (metadata && !isLoading) {
      console.log("Preloading song for token ID:", tokenId);
      preloadSong(metadata);

      // Get duration from audio element if we're currently playing this song
      if (isCurrentSong && duration > 0) {
        setSongDuration(duration);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.animation_url, isLoading, tokenId]);

  // Update song duration when this becomes the current song
  useEffect(() => {
    if (isCurrentSong && duration > 0 && songDuration !== duration) {
      setSongDuration(duration);
    }
  }, [isCurrentSong, duration, songDuration]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Use hidden audio element to get song duration even when not playing
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;

    if (metadata?.animation_url && !isCurrentSong && songDuration === 0) {
      audio = new Audio(metadata.animation_url);

      const handleLoadedMetadata = () => {
        if (audio && audio.duration && audio.duration !== Infinity) {
          console.log(`Got duration for song ${tokenId}:`, audio.duration);
          setSongDuration(audio.duration);
        }
      };

      const handleError = (e: ErrorEvent) => {
        console.error(`Error loading audio for song ${tokenId}:`, e);
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("error", handleError);

      return () => {
        if (audio) {
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.removeEventListener("error", handleError);
          audio = null;
        }
      };
    }
  }, [metadata?.animation_url, isCurrentSong, songDuration, tokenId]);

  // Utility functions
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
      trackEvent("song_paused", {
        fid: userFid,
        songId: tokenId,
        songName: metadata.name,
      });
    } else {
      play(metadata, tokenId);
      trackEvent("song_played", {
        fid: userFid,
        songId: tokenId,
        songName: metadata.name,
      });
    }
  };

  const handleClickUser = async (fid: number) => {
    if (contextType === "farcaster" && context?.user?.fid) {
      await sdk.actions.viewProfile({ fid });
    }
  };

  // Sort collectors by amount
  const sortedCollectors = useMemo(() => {
    if (collectorsLoading || !collectors) return [];
    return [...collectors].sort((a, b) => b.amount - a.amount);
  }, [collectors, collectorsLoading]);

  const {
    data: userCollectorData,
    isLoading: userCollectorIsLoading,
    refetch: refetchUserCollector,
  } = useUserCollector(tokenId, userFid);

  const { totalMints, isLoading: totalMintsLoading } = useTotalMints(tokenId);

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full pb-8 gap-6">
      <Header />

      <div className="flex flex-col items-center gap-6 w-full">
        {/* Artwork */}
        <div className="w-full max-w-lg aspect-square bg-black border border-white/80 rounded-lg relative overflow-hidden">
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
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-lg">
          <div className="flex flex-col items-center gap-2 w-full">
            <TitleAndLinks
              metadata={metadata}
              tokenId={tokenId}
              splitsAddress={getTokenInfoResult.data?.receiverAddress}
            />
            <Feat
              featuringUsers={featuringDetails?.users}
              featuringText={featuringDetails?.text}
              isLoading={featuringLoading}
            />
          </div>

          {/* Player Controls */}
          <PlayerControls
            isLoading={isLoading}
            isPlaying={isPlaying}
            isCurrentSong={isCurrentSong}
            handlePlayPause={handlePlayPause}
            displayTime={displayTime}
            displayDuration={displayDuration}
            handleSliderValueChange={handleSliderValueChange}
            handleSliderCommit={handleSliderCommit}
            formatTime={formatTime}
          />

          {/* Mint Status */}
          <MintStatus
            status={status}
            countdown={countdown}
            setIsMintModalOpen={setIsMintModalOpen}
            tokenId={tokenId}
          />
        </div>

        {/* Song Data Section */}
        <SongData
          totalMints={totalMints}
          totalCollectors={totalCollectors}
          usdPrice={usdPrice}
          isLoading={totalMintsLoading || collectorsLoading}
        />

        {/* Description Section */}
        <SongDescription
          metadata={metadata}
          isLoading={isLoading}
        />

        {/* Collectors Section */}
        <CollectorsSection
          collectorsLoading={collectorsLoading}
          sortedCollectors={sortedCollectors}
          userFid={userFid}
          tokenId={tokenId}
          handleClickUser={handleClickUser}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          userCollectorIsLoading={userCollectorIsLoading}
          userCollectorData={userCollectorData}
        />

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
            refetchCollectors={refetchCollectors}
            refetchUserCollector={refetchUserCollector}
          />
        )}
      </div>

      {showScrollToTopButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-zinc-800 hover:bg-zinc-800/80 text-white p-3 rounded-lg shadow-lg transition-colors duration-300 z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
