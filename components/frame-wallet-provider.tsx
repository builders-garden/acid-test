import { CHAIN } from "@/lib/constants";
import { frameConnector } from "@/lib/frame-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { ChainHandler } from "./chain-handler";

export const config = createConfig({
  chains: [CHAIN],
  transports: {
    [CHAIN.id]: http(),
  },
  connectors: [frameConnector()],
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
