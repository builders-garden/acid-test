import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// https://env.t3.gg/docs/nextjs
export const env = createEnv({
  server: {
    NEYNAR_API_KEY: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    PINATA_JWT_SECRET: z.string().min(1),
    QSTASH_URL: z.string().min(1),
    QSTASH_TOKEN: z.string().min(1),
    QSTASH_CURRENT_SIGNING_KEY: z.string().min(1),
    QSTASH_NEXT_SIGNING_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_URL: z.string().min(1),
    NEXT_PUBLIC_APP_ENV: z
      .enum(["development", "production"])
      .optional()
      .default("development"),
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_GATEWAY_URL: z.string().min(1),
    NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS: z.string().min(1),
    NEXT_PUBLIC_SMART_CONTRACT_ADDRESS: z.string().min(1),
    // PostHog
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_DISABLED: z.string().optional(),
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
    NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS:
      process.env.NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS,
    NEXT_PUBLIC_SMART_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS,
    // PostHog
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_DISABLED: process.env.NEXT_PUBLIC_POSTHOG_DISABLED,
  },
});
