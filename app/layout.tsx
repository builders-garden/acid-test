import type { Metadata } from "next";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";
import dynamic from "next/dynamic";
import { FrameProvider } from "@/components/farcaster-provider";
import { Toaster } from "@/components/ui/sonner";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { FrameStatusProvider } from "@/contexts/FrameStatusContext";
import localFont from "next/font/local";
import { AppWrapper } from "@/components/app-wrapper";
import { PostHogProvider } from "@/components/posthog-provider";

const suisseIntlMono = localFont({
  src: "../public/fonts/SuisseIntlMono-Regular-WebS.ttf",
  variable: "--font-suisse-intl-mono",
});

export const metadata: Metadata = {
  title: "Acid Test",
  description:
    "ACIDTEST is an onchain radio show bringing music, conversation and creative energy to Farcaster. Hosted by chaim.eth.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ErudaProvider = dynamic(
    () => import("../components/Eruda").then((c) => c.ErudaProvider),
    {
      ssr: false,
    }
  );
  return (
    <html lang="en">
      <body className={`${suisseIntlMono.variable} font-mono`}>
        <ErudaProvider>
          <PostHogProvider>
            <FrameProvider>
              <MiniKitProvider>
                <AudioPlayerProvider>
                  <FrameStatusProvider>
                    <AppWrapper>{children}</AppWrapper>
                    <Toaster />
                  </FrameStatusProvider>
                </AudioPlayerProvider>
              </MiniKitProvider>
            </FrameProvider>
          </PostHogProvider>
        </ErudaProvider>
      </body>
    </html>
  );
}
