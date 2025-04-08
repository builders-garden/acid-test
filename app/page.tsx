import { Metadata } from "next";
import App from "@/components/pages/app";
import { env } from "@/lib/env";

const appUrl = env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: `${appUrl}/images/feed.jpg`,
  button: {
    title: "Open Acid Test",
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
      description: "Mint and listen to Acid Test.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
