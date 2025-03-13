"use client";

import { CHAIN } from "@/lib/constants";
import { useEffect } from "react";
import { useChainId, useSwitchChain } from "wagmi";

export const ChainHandler = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (chainId !== CHAIN.id) {
      switchChain({
        chainId: CHAIN.id,
      });
    }
  }, [chainId, switchChain]);

  return null;
};
