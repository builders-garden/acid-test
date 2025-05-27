import { env } from "@/lib/env";

/**
 * Get the farcaster manifest for the frame, generate yours from Warpcast Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 * @returns The farcaster manifest for the frame
 */
export async function getFarcasterManifest() {
  let frameName = "Acid Test";
  const appUrl = env.NEXT_PUBLIC_URL;
  if (appUrl.includes("localhost")) {
    frameName += " Local";
  } else if (appUrl.includes("ngrok")) {
    frameName += " NGROK";
  }
  // else if (appUrl.includes("dev.acidtest.xyz")) {
  //   frameName += " Dev";
  // }
  return {
    accountAssociation: {
      header: env.NEXT_PUBLIC_FARCASTER_HEADER,
      payload: env.NEXT_PUBLIC_FARCASTER_PAYLOAD,
      signature: env.NEXT_PUBLIC_FARCASTER_SIGNATURE,
    },
    frame: {
      version: "1",
      name: frameName,
      iconUrl: `${appUrl}/images/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/images/feed.jpg`,
      buttonTitle: `Start Acid Test`,
      splashImageUrl: `${appUrl}/images/icon.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `${appUrl}/api/webhook`,
      // Metadata https://miniapps.farcaster.xyz/docs/specification#frame
      subtitle: "Mint new episodes weekly", // 30 characters, no emojis or special characters, short description under app name
      description: "A radio show for Farcaster", // 170 characters, no emojis or special characters, promotional message displayed on Mini App Page
      primaryCategory: "news-media",
      tags: ["music", "podcast", "interviews", "radio", "chaim"], // up to 5 tags, filtering/search tags
      tagline: "Mint new episodes weekly", // 30 characters, marketing tagline should be punchy and descriptive
      ogTitle: "Acid Test", // 30 characters, app name + short tag, Title case, no emojis
      ogDescription: "A radio show for Farcaster", // 100 characters, summarize core benefits in 1-2 lines
      // screenshotUrls: [
      //   // 1284 x 2778, visual previews of the app, max 3 screenshots
      //   `${env.NEXT_PUBLIC_URL}/images/screenshots/1.png`,
      //   `${env.NEXT_PUBLIC_URL}/images/screenshots/2.png`,
      //   `${env.NEXT_PUBLIC_URL}/images/screenshots/3.png`,
      // ],
      heroImageUrl: `${env.NEXT_PUBLIC_URL}/images/promo.jpg`, // 1200 x 630px (1.91:1), promotional display image on top of the mini app store
      ogImageUrl: `${env.NEXT_PUBLIC_URL}/images/promo.jpg`, // 1200 x 630px (1.91:1), promotional image, same as app hero image
    },
  };
}
