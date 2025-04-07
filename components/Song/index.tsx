"use client";

import { useState, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { MintModal } from "@/components/Song/mint-modal";
import { PlayerControls } from "./player-controls";
import { MintStatus } from "./mint-status";
import { CollectorsSection } from "./collectors-section";

import { useAccount, useReadContract } from "wagmi";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useCollectors } from "@/hooks/use-get-collectors";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";

import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import {
  composeSongCastUrl,
  copyToClipboard,
  fetchWithIPFSFallback,
  formatSongId,
} from "@/lib/utils";
import { SongMetadata } from "@/types";
import sdk from "@farcaster/frame-sdk";
import { Check, Share2 } from "lucide-react";
import Image from "next/image";
import copy from "@/public/images/copy.svg";
import { Header } from "../ui/header";

export default function Song() {
  // State management
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
  const [userFid, setUserFid] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [frameUrl, setFrameUrl] = useState("");
  const [castUrl, setCastUrl] = useState("");

  // Hooks
  const { isPlaying, currentSong, play, pause, currentTime, duration, seek } =
    useAudioPlayer();
  const { type: contextType, context } = useMiniAppContext();
  const { address } = useAccount();
  const pathname = usePathname();
  const router = useRouter();

  // Extract token ID from URL path
  const tokenId = useMemo(() => {
    const pathSegments = pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    const parsedId = parseInt(lastSegment);
    return isNaN(parsedId) ? 1 : parsedId;
  }, [pathname]);

  const {
    collectors,
    isLoading: collectorsLoading,
    refetch,
  } = useCollectors(tokenId);

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

  // Utility functions
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

  const handleClickUser = async (fid: number) => {
    if (contextType === "farcaster" && context?.user?.fid) {
      await sdk.actions.viewProfile({ fid });
    }
  };

  // Derived state
  const isCurrentSong = currentSong.tokenId === tokenId;
  const displayTime = isDragging ? seekValue : isCurrentSong ? currentTime : 0;
  const displayDuration = isCurrentSong ? duration : 0;

  // Sort collectors by amount
  const sortedCollectors = useMemo(() => {
    if (collectorsLoading || !collectors) return [];
    return [...collectors].sort((a, b) => b.amount - a.amount);
  }, [collectors, collectorsLoading]);

  // Get user position in collector list
  const userPosition = useMemo(() => {
    if (!userFid || !collectors) return null;
    const index = sortedCollectors.findIndex((c) => c.user?.fid === userFid);
    return index !== -1 ? index + 1 : null;
  }, [userFid, sortedCollectors, collectors]);

  useEffect(() => {
    if (metadata) {
      const { frameUrl, castUrl } = composeSongCastUrl(tokenId, metadata.name);
      setFrameUrl(frameUrl);
      setCastUrl(castUrl);
    }
  }, [metadata, tokenId]);

  const handleShareSong = () => {
    if (contextType === "farcaster" && context?.user?.fid) {
      sdk.actions.openUrl(castUrl);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full">
      <Header />

      {/* Player Controls */}
      <PlayerControls
        metadata={metadata}
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

      {/* Song Title and Release Number */}
      <div className="w-full max-w-md text-center mb-8">
        <h2 className="text-[18px] font-bold">{metadata?.name || "LOADING"}</h2>
        <div className="text-[14px] text-white">{formatSongId(tokenId)}</div>
      </div>

      {/* Mint Status */}
      <MintStatus
        status={status}
        countdown={countdown}
        setIsMintModalOpen={setIsMintModalOpen}
        tokenId={tokenId}
      />

      {/* Share Buttons */}
      <div className="flex gap-2 mb-8 w-full">
        <button
          onClick={handleShareSong}
          className="p-2 border border-white hover:bg-white/10 transition-colors rounded"
          aria-label="Share"
        >
          <Share2 width={20} height={20} />
        </button>
        <button
          onClick={() => copyToClipboard(frameUrl, setLinkCopied)}
          className="p-2 border border-white hover:bg-white/10 transition-colors rounded"
          aria-label="Copy link"
        >
          {linkCopied ? (
            <Check width={20} height={20} />
          ) : (
            <Image
              src={copy}
              alt="Copy"
              width={20}
              height={20}
              className="rounded-sm"
            />
          )}
        </button>
        <button
          onClick={() =>
            sdk.actions.openUrl(
              `https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`
            )
          }
          className="p-2 border border-white hover:bg-white/10 transition-colors rounded"
          aria-label="View on OpenSea"
        >
          <Image
            src="/images/opensea.png"
            alt="OpenSea"
            width={20}
            height={20}
            className="rounded-sm"
          />
        </button>
      </div>

      {/* Collectors Section */}
      <CollectorsSection
        collectorsLoading={collectorsLoading}
        sortedCollectors={sortedCollectors}
        userFid={userFid}
        userPosition={userPosition}
        tokenId={tokenId}
        handleClickUser={handleClickUser}
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
          refetch={refetch}
        />
      )}
    </div>
  );
}
