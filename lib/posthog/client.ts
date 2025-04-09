import posthog from "posthog-js";
import { env } from "@/lib/env";

export const trackEvent = (event: string, data: Record<string, unknown>) => {
  if (env.NEXT_PUBLIC_POSTHOG_DISABLED === "true") {
    return;
  }
  console.log("tracking event", event, data);
  return posthog.capture(event, data);
};
