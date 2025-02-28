import { Metadata } from "next";
import { env } from "@/lib/env";
import SongPage from "@/components/pages/song";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const requestId = params.id;

  const frame = {
    version: "next",
    imageUrl: `${appUrl}/images/feed.png`,
    button: {
      title: "Launch App",
      action: {
        type: "launch_frame",
        name: "Mini-app Starter",
        url: `${appUrl}/songs/${requestId}`,
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

export default function Song() {
  return <SongPage />;
}
