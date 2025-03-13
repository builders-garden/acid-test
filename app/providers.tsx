"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

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
