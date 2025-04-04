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
    imageUrl: `${appUrl}/images/feed.jpg`,
    button: {
      title: "Listen to Song",
      action: {
        type: "launch_frame",
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
      description: "Mint and listen to Acid Test's songs.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Song() {
  return <SongPage />;
}
