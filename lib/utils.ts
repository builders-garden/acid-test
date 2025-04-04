import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "./env";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatSongId = (id: number) => {
  return "AT" + id.toString().padStart(3, "0");
};

export const formatCountdown = (seconds: number) => {
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

export const composeSongCastUrl = (songId: number, songTitle: string) => {
  const frameUrl = `${env.NEXT_PUBLIC_URL}/songs/${songId}`;
  const text = `Listen to ${songTitle} by Acid Test 💿`;
  const urlFriendlyText = encodeURIComponent(text);
  return {
    frameUrl,
    castUrl: `https://warpcast.com/~/compose?text=${urlFriendlyText}&embeds[]=${encodeURIComponent(
      frameUrl
    )}`,
  };
};

export const composeMintCastUrl = (
  songId: number,
  songTitle: string,
  mintQuantity: number
) => {
  const frameUrl = `${env.NEXT_PUBLIC_URL}/songs/${songId}`;
  const text = `I just minted ${mintQuantity} ${
    mintQuantity === 1 ? "edition" : "editions"
  } of ${songTitle} by Acid Test 💿`;
  const urlFriendlyText = encodeURIComponent(text);
  return {
    frameUrl,
    castUrl: `https://warpcast.com/~/compose?text=${urlFriendlyText}&embeds[]=${encodeURIComponent(
      frameUrl
    )}`,
  };
};

export const copyToClipboard = (
  text: string | undefined,
  setShowCopied: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!text) return;

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);

  textArea.select();
  try {
    document.execCommand("copy");
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 750);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }

  document.body.removeChild(textArea);
};

/**
 * Fetches data from IPFS with gateway fallback
 * @param uri Original IPFS URI (usually Pinata gateway)
 * @param timeout Timeout in milliseconds for each attempt
 */
export async function fetchWithIPFSFallback<T>(
  uri: string,
  timeout: number = 10000
): Promise<T> {
  try {
    // First attempt with original URI
    const response = await axios.get<T>(uri, { timeout });
    return response.data;
  } catch (error) {
    // If original request fails, try dweb.link gateway
    try {
      // Extract CID from Pinata URL
      const cid = uri.split("/").pop();
      if (!cid) throw new Error("Invalid IPFS URI");

      const dwebUrl = `https://${cid}.ipfs.dweb.link/#x-ipfs-companion-no-redirect`;
      const fallbackResponse = await axios.get<T>(dwebUrl, { timeout });
      return fallbackResponse.data;
    } catch (fallbackError) {
      throw new Error(`Failed to fetch from both gateways: ${fallbackError}`);
    }
  }
}
