"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";


const queryClient = new QueryClient();

function CustomWagmiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
    
        {children}
     
    </WagmiProvider>
  );
}

export default CustomWagmiProvider;