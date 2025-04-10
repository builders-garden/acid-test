import { Metadata } from "next";
import { env } from "@/lib/env";
import SongsPage from "@/components/pages/songs";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/images/feed.jpg`,
    button: {
      title: "View Episodes",
      action: {
        type: "launch_frame",
        name: "Acid Test",
        url: `${appUrl}/songs`,
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
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Songs() {
  return <SongsPage />;
}
