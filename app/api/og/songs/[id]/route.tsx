import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { loadLocalFont } from "@/lib/og-utils";
import { fetchWithIPFSFallback } from "@/lib/utils";
import { getCollectorsBySongId } from "@/lib/prisma/queries";
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
    const songId = Number(id);

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

    // Get song metadata and collectors information
    const [metadata, collectors] = await Promise.all([
      fetchWithIPFSFallback<SongMetadata>(uri),
      getCollectorsBySongId(songId).catch(() => []),
    ]);

    const songArtwork = metadata.image || "";

    // Sort collectors by amount and get top 5
    const sortedCollectors = collectors.sort((a, b) => b.amount - a.amount);
    const totalCollectors = collectors.length;
    const topCollectors = sortedCollectors.slice(0, 10);

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
          {/* Main artwork container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Image container */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                overflow: "hidden",
                backgroundColor: "black",
              }}
            >
              <img
                src={songArtwork}
                style={{
                  width: "100%",
                  height: "auto",
                  objectPosition: "top",
                  marginBottom: "-33.33%",
                  imageRendering: "crisp-edges",
                  boxShadow: "none",
                  filter: "none",
                }}
              />
              {/* Dark gradient overlay - darkens the bottom area */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.9) 100%)",
                  display: "flex",
                }}
              />
            </div>

            {/* Collectors section - positioned at bottom-left */}
            <div
              style={{
                position: "absolute",
                left: 50,
                bottom: 50,
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                zIndex: 10,
                width: "auto",
                minWidth: "350px",
              }}
            >
              {/* Collectors count and background */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "15px",
                }}
              >
                {/* Collector avatars - only rendered if there are collectors */}
                {topCollectors.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {topCollectors.map((collector, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "60px",
                          height: "60px",
                          borderRadius: "50%",
                          border: "2px solid #FFFFFF",
                          overflow: "hidden",
                          marginLeft: index > 0 ? "-25px" : "0",
                          boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
                          zIndex: 5 - index,
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <img
                          src={
                            collector.user?.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${
                              collector.user?.username || "User"
                            }&background=random&size=60`
                          }
                          width="60"
                          height="60"
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
                {/* Header text */}
                <div
                  style={{
                    fontSize: "35px",
                    color: "#FFFFFF",
                    fontFamily: "SuisseIntlMono",
                    marginBottom: "8px",
                    display: "flex",
                  }}
                >
                  {totalCollectors}{" "}
                  {totalCollectors === 1 ? "COLLECTOR" : "COLLECTORS"}
                </div>
              </div>
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
    console.log(`Failed to generate song OG image`, e);
    return new Response(`Failed to generate song OG image`, {
      status: 500,
    });
  }
}
