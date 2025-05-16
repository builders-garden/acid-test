import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { env } from "@/lib/env";
import { loadGoogleFont, loadImage } from "@/lib/og-utils";
import { fetchWithIPFSFallback } from "@/lib/utils";
import { SongMetadata } from "@/types";
import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { useReadContract } from "wagmi";

// Force dynamic rendering to ensure fresh image generation on each request
export const dynamic = "force-dynamic";

// Define the dimensions for the generated OpenGraph image
const size = {
  width: 600,
  height: 400,
};

/**
 * GET handler for generating dynamic OpenGraph images
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the ID
 * @returns ImageResponse - A dynamically generated image for OpenGraph
 */
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // Extract the ID from the route parameters
    const { id } = await params;

    // Get the application's base URL from environment variables
    const appUrl = env.NEXT_PUBLIC_URL;

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Load the uri from the smart contract
    const getTokenInfosResult = await publicClient.readContract({
      abi: AcidTestABI,
      address: CONTRACT_ADDRESS,
      functionName: "getTokenInfo",
      args: [BigInt(id)],
    });
    const uri = getTokenInfosResult.uri;

    const metadata = await fetchWithIPFSFallback<SongMetadata>(uri);
    const title = metadata.name || "";
    const image = metadata.image || "";

    // Load the image from the provided URI and get its data
    const imageData = await loadImage(image);
    const imageBuffer = Buffer.from(imageData);
    const base64Image = imageBuffer.toString("base64");

    // Generate and return the image response with the composed elements
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "black",
          }}
        >
          <img
            src={`data:image/png;base64,${base64Image}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (e) {
    // Log and handle any errors during image generation
    console.log(`Failed to generate streak image`, e);
    return new Response(`Failed to generate streak image`, {
      status: 500,
    });
  }
}
