import type { Metadata } from "next";
import "./globals.css";
import MiniKitProvider from "@/components/minikit-provider";
import { ErudaProvider } from "@/components/Eruda/eruda-dynamic";
import { FarcasterProvider } from "@/components/farcaster-provider";
import { Toaster } from "@/components/ui/sonner";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import localFont from "next/font/local";
import { AppWrapper } from "@/components/app-wrapper";
import { PostHogProvider } from "@/components/posthog-provider";
import { MiniAppStatusProvider } from "@/contexts/MiniAppStatusContext";

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
  return (
    <html lang="en">
      <body className={`${suisseIntlMono.variable} font-mono`}>
        <ErudaProvider>
          <PostHogProvider>
            <FarcasterProvider addMiniAppOnLoad={true}>
              <MiniKitProvider>
                <AudioPlayerProvider>
                  <MiniAppStatusProvider>
                    <AppWrapper>{children}</AppWrapper>
                    <Toaster />
                  </MiniAppStatusProvider>
                </AudioPlayerProvider>
              </MiniKitProvider>
            </FarcasterProvider>
          </PostHogProvider>
        </ErudaProvider>
      </body>
    </html>
  );
}
