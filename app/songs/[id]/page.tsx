import { Metadata } from "next";
import { env } from "@/lib/env";
import SongPage from "@/components/pages/song";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: requestId } = await params;

  // Add timestamp as query parameter to bust cache every minute
  const timestamp = Math.floor(Date.now() / 60000); // Changes every minute
  const imageUrl = new URL(
    `${appUrl}/api/og/songs/${requestId}?t=${timestamp}`
  ).toString();

  const miniapp = {
    version: "next",
    imageUrl,
    button: {
      title: "Launch App",
      action: {
        type: "launch_miniapp",
        name: "Acid Test",
        url: `${appUrl}/songs/${requestId}`,
        splashImageUrl: `${appUrl}/images/icon.png`,
        splashBackgroundColor: "#000000",
      },
    },
  };

  return {
    title: "Acid Test",
    openGraph: {
      title: "Acid Test",
      description:
        "ACIDTEST is an onchain radio show bringing music, conversation and creative energy to Farcaster. Hosted by chaim.eth.",
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    other: {
      "fc:miniapp": JSON.stringify(miniapp),
    },
  };
}

export default function Song() {
  return <SongPage />;
}
