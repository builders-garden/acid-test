import { Metadata } from "next";
import { env } from "@/lib/env";
import AboutPage from "@/components/pages/about";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/images/feed.jpg`,
    button: {
      title: "About Acid Test",
      action: {
        type: "launch_frame",
        name: "Acid Test",
        url: `${appUrl}/about`,
        splashImageUrl: `${appUrl}/images/icon.png`,
        splashBackgroundColor: "#000000",
      },
    },
  };

  return {
    title: "Acid Test",
    openGraph: {
      title: "Acid Test",
      description: "Mint and listen to Acid Test's songs.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function About() {
  return <AboutPage />;
}
