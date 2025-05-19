import { Metadata } from "next";
import { env } from "@/lib/env";
import SongPage from "@/components/pages/song";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { fetchWithIPFSFallback, getReliableImageUrl } from "@/lib/utils";
import { SongMetadata } from "@/types";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const appUrl = env.NEXT_PUBLIC_URL;
const CONTRACT_ADDRESS = env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;

// Create a public client to read from the blockchain
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Function to fetch song metadata
async function getSongMetadata(tokenId: string): Promise<SongMetadata | null> {
  try {
    // Get token URI from contract
    const tokenInfo = await publicClient.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: AcidTestABI,
      functionName: "getTokenInfo",
      args: [BigInt(tokenId)],
    });

    if (!tokenInfo || !tokenInfo.uri) return null;

    // Fetch metadata from IPFS
    const metadata = await fetchWithIPFSFallback<SongMetadata>(tokenInfo.uri);
    return metadata;
  } catch (error) {
    console.error("Error fetching song metadata:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const requestId = params.id;

  const imageUrl = new URL(`${appUrl}/api/og/songs/${requestId}`).toString();

  // Fetch song metadata to get the song image for favicon
  const songMetadata = await getSongMetadata(requestId);

  // Use our reliable image URL function to ensure the image loads
  const faviconUrl = songMetadata?.image
    ? getReliableImageUrl(songMetadata.image)
    : "/favicon.ico";

  const frame = {
    version: "next",
    imageUrl,
    button: {
      title: "Launch App",
      action: {
        type: "launch_frame",
        name: "Acid Test",
        url: `${appUrl}/songs/${requestId}`,
        splashImageUrl: faviconUrl,
        splashBackgroundColor: "#000000",
      },
    },
  };

  return {
    title: songMetadata?.name
      ? `${songMetadata.name} | Acid Test`
      : "Acid Test",
    icons: [
      {
        rel: "icon",
        url: faviconUrl,
      },
    ],
    openGraph: {
      title: songMetadata?.name || "Acid Test",
      description:
        "ACIDTEST is an onchain radio show bringing music, conversation and creative energy to Farcaster. Hosted by chaim.eth.",
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Song() {
  return <SongPage />;
}
