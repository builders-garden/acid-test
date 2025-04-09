"use client";

import { env } from "@/lib/env";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { ReactNode } from "react";

export function PHProvider({ children }: { children: ReactNode }) {
  if (typeof window !== "undefined") {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      person_profiles: "identified_only",
    });
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
