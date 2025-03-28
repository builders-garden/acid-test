import { Metadata } from "next";
import { env } from "@/lib/env";
import SongsPage from "@/components/pages/songs";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/images/feed.png`,
    button: {
      title: "Launch App",
      action: {
        type: "launch_frame",
        name: "Mini-app Starter",
        url: `${appUrl}/songs`,
        splashImageUrl: `${appUrl}/images/splash.png`,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: "Mini-app Starter",
    openGraph: {
      title: "Mini-app Starter",
      description: "A starter for mini-apps",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Songs() {
  return <SongsPage />;
}
