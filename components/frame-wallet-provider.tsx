import { CHAIN } from "@/lib/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { ChainHandler } from "./chain-handler";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

export const config = createConfig({
  chains: [CHAIN],
  transports: {
    [CHAIN.id]: http("https://base.drpc.org"),
  },
  connectors: [farcasterFrame()],
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChainHandler />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
