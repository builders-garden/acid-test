import { PostHog } from "posthog-node";
import { env } from "@/lib/env";

const posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
  host: "https://us.i.posthog.com",
});

export const trackEvent = (
  fid: number,
  event: string,
  properties: Record<string, unknown>
) => {
  if (env.NEXT_PUBLIC_POSTHOG_DISABLED === "true") {
    return;
  }
  console.log("tracking event", event, properties);
  posthog.capture({
    distinctId: fid.toString(),
    event,
    properties,
  });
};
