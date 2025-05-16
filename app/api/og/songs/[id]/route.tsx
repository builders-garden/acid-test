import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { env } from "@/lib/env";
import { loadLocalFont } from "@/lib/og-utils";
import { fetchWithIPFSFallback } from "@/lib/utils";
import { SongMetadata } from "@/types";
import { ImageResponse } from "next/og";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Force dynamic rendering to ensure fresh image generation on each request
export const dynamic = "force-dynamic";

// Define the dimensions for the generated OpenGraph image
const size = {
  width: 1200,
  height: 800,
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
    const songArtwork = metadata.image || "";

    // Load the custom font
    const fontData = await loadLocalFont(
      "fonts/SuisseIntlMono-Regular-WebS.ttf"
    );

    // Generate and return the image response with the composed elements
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            backgroundColor: "black",
          }}
        >
          {/* Main artwork and title container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Image container with proper positioning */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                overflow: "hidden",
                backgroundColor: "black" /* Ensure solid background */,
              }}
            >
              <img
                src={songArtwork}
                style={{
                  width: "100%",
                  height: "auto",
                  objectPosition: "top",
                  marginBottom: "-33.33%",
                  imageRendering:
                    "crisp-edges" /* Improve rendering for high-resolution images */,
                  boxShadow: "none" /* Remove any default shadow */,
                  filter: "none" /* Remove any default filter */,
                }}
              />
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "SuisseIntlMono",
            data: fontData,
            style: "normal",
          },
        ],
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
