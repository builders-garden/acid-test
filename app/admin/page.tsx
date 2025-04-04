import { Metadata } from "next";
import { env } from "@/lib/env";
import AdminPage from "@/components/Admin";

const appUrl = env.NEXT_PUBLIC_URL;

export async function generateMetadata(): Promise<Metadata> {
  const frame = {
    version: "next",
    imageUrl: `${appUrl}/images/feed.jpg`,
    button: {
      title: "Open Acid Test",
      action: {
        type: "launch_frame",
        name: "Acid Test",
        url: `${appUrl}/admin`,
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

export default function Admin() {
  return <AdminPage />;
}
