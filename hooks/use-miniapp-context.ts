import { useFarcaster } from "../components/farcaster-provider";
import { MiniKit } from "@worldcoin/minikit-js";
import { MiniAppContext } from "@farcaster/miniapp-core/dist/context";

export enum ContextType {
  Farcaster = "farcaster",
  Worldcoin = "worldcoin",
}

// Define specific types for each context
interface FarcasterContextResult {
  type: ContextType.Farcaster;
  context: MiniAppContext;
  actions: null;
}

interface WorldcoinContextResult {
  type: ContextType.Worldcoin;
  context: MiniKit;
  actions: null;
}

interface NoContextResult {
  type: null;
  context: null;
  actions: null;
}

// Union type of all possible results
type ContextResult =
  | FarcasterContextResult
  | WorldcoinContextResult
  | NoContextResult;

export const useMiniAppContext = (): ContextResult => {
  // Try to get Farcaster context
  try {
    const farcasterContext = useFarcaster();
    if (farcasterContext.context && farcasterContext.isMiniAppReady) {
      return {
        type: ContextType.Farcaster,
        context: farcasterContext.context,
        actions: null,
      } as FarcasterContextResult;
    }
  } catch (e) {
    // Ignore error if not in Farcaster context
  }

  // Check for Worldcoin/MiniKit context
  if (typeof window !== "undefined" && MiniKit.isInstalled()) {
    return {
      type: ContextType.Worldcoin,
      context: MiniKit,
      actions: null,
    } as WorldcoinContextResult;
  }

  // No context found
  return {
    type: null,
    context: null,
    actions: null,
  } as NoContextResult;
};
