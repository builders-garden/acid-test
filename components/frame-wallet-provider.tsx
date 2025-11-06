import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { ChainHandler } from "./chain-handler";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { base } from "viem/chains";

export const config = createConfig({
  chains: [base],
  ssr: true,
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
  connectors: [miniAppConnector()],
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
