import { createConfig, http } from "wagmi";
import {
  base,
  baseSepolia
} from "viem/chains";
import { env } from "@/lib/env";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

const chains = [
  base,
  baseSepolia,
] as const;

export const wagmiConfig = createConfig({
    chains: chains,
    transports: {
      [baseSepolia.id]: http("https://sepolia.base.org"),
      [base.id]: http("https://base.llamarpc.com")
    },
    connectors: [farcasterFrame()],
});