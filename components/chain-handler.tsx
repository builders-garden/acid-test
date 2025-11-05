"use client";

import { CHAIN } from "@/lib/constants";
import { useEffect } from "react";
import { useChainId, useSwitchChain, useConnect, useAccount } from "wagmi";

export const ChainHandler = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connect, connectors, error: connectError } = useConnect();
  const { isConnected } = useAccount();

  // handle wagmi connection errors
  useEffect(() => {
    if (connectError) {
      console.error("wagmi connection error", connectError);
    }
  }, [connectError]);

  // Connect wallet on mount if not connected
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connect, connectors]);

  // Switch to correct chain if needed
  useEffect(() => {
    if (chainId !== CHAIN.id) {
      switchChain({
        chainId: CHAIN.id,
      });
    }
  }, [chainId, switchChain]);

  return null;
};
