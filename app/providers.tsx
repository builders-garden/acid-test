"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { base, baseSepolia } from "viem/chains";


import { env } from "@/lib/env";




const CustomWagmiProvider = dynamic(
  () => import("@/lib/wagmi/custom-wagmi-provider").then((c) => c.default),
  {
    ssr: false,
  }
);

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();

  return (
    <>
        <CustomWagmiProvider>{children}</CustomWagmiProvider>
    </>
  );
};