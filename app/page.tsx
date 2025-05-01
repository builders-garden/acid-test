import { Metadata } from "next";
import App from "@/components/pages/app";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/images/feed.jpg`,
  button: {
    title: "Launch App",
    action: {
      type: "launch_frame",
      name: "Acid Test",
      url: appUrl,
      splashImageUrl: `${appUrl}/images/icon.png`,
      splashBackgroundColor: "#000000",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
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

export default function Home() {
  return <App />;
}
