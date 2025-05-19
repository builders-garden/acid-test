import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "./env";
import axios from "axios";
import sdk from "@farcaster/frame-sdk";

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

export const composeSongCastUrl = (
  songId: number,
  songTitle: string
): {
  text: string;
  embeds: [string];
} => {
  const frameUrl = `${env.NEXT_PUBLIC_URL}/songs/${songId}`;
  const text = `Listen to ${songTitle} by Acid Test 💿`;
  return {
    text,
    embeds: [frameUrl],
  };
};

export const composeMintCastUrl = (
  songId: number,
  songTitle: string,
  mintQuantity: number
): {
  text: string;
  embeds: [string];
} => {
  const frameUrl = `${env.NEXT_PUBLIC_URL}/songs/${songId}`;
  const text = `I just minted ${mintQuantity} ${
    mintQuantity === 1 ? "edition" : "editions"
  } of ${songTitle} by Acid Test 💿`;
  return {
    text,
    embeds: [frameUrl],
  };
};

export const copyToClipboard = async (
  text: string | undefined,
  setShowCopied: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 750);
  } catch (err) {
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
  }
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

export const handleAddFrame = async () => {
  try {
    const result = await sdk.actions.addFrame();
    return result.notificationDetails;
  } catch (error) {
    console.error("Error adding frame:", error);
    throw error;
  }
};

export const getFeaturingDetails = (
  songId: number
): { name: string; pfp: string; fid: number; text?: string } => {
  switch (songId) {
    case 1:
      return { name: "jc4p", pfp: "/images/jc4p.avif", fid: 977233 };
    case 2:
      return { name: "ted", pfp: "/images/ted.png", fid: 239 };
    case 3:
      return {
        name: "dwr.eth",
        pfp: "/images/dwr.png",
        fid: 3,
        text: "+ 42 others",
      };
    case 4:
      return { name: "phil", pfp: "/images/phil.png", fid: 129 };
    default:
      return { name: "Unknown", pfp: "/images/unknown.png", fid: 1 };
  }
};

// Helper function to extract CID from an IPFS URL (similar to fetchWithIPFSFallback)
export const extractCIDFromIPFSUrl = (url: string): string | null => {
  try {
    // Handle ipfs:// protocol
    if (url.startsWith("ipfs://")) {
      return url.substring(7);
    }

    // Handle gateway URLs that contain IPFS paths
    const ipfsMatch = url.match(/\/ipfs\/([^/?#]+)/);
    if (ipfsMatch && ipfsMatch[1]) {
      return ipfsMatch[1];
    }

    // Handle URLs where CID is the last part of the path
    const parts = url.split("/");
    const potentialCid = parts[parts.length - 1].split("?")[0].split("#")[0];
    if (potentialCid && potentialCid.length > 8) {
      return potentialCid;
    }

    return null;
  } catch (error) {
    console.error("Error extracting CID:", error);
    return null;
  }
};

// Function to get alternative IPFS URLs for audio playback
export const getAudioWithFallback = (url: string): string[] => {
  const urls = [url]; // Original URL is always the first attempt

  const cid = extractCIDFromIPFSUrl(url);
  if (cid) {
    // Add alternative gateways
    urls.push(`https://${cid}.ipfs.dweb.link/#x-ipfs-companion-no-redirect`);
    urls.push(`https://ipfs.io/ipfs/${cid}`);
    urls.push(`https://gateway.pinata.cloud/ipfs/${cid}`);
    urls.push(`https://cloudflare-ipfs.com/ipfs/${cid}`);
  }

  return urls;
};
