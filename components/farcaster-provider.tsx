"use client";

import type {
  MiniAppContext,
  SafeAreaInsets,
} from "@farcaster/miniapp-core/dist/context";
import {
  type MiniAppHostCapability,
  sdk as miniappSdk,
} from "@farcaster/miniapp-sdk";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import FrameWalletProvider from "./frame-wallet-provider";

type FarcasterContextType = {
  isMiniAppReady: boolean;
  isInMiniApp: boolean;
  context: MiniAppContext | null;
  capabilities: MiniAppHostCapability[] | null;
  safeAreaInsets: SafeAreaInsets;
  error: string | null;
};

export const FarcasterContext = createContext<FarcasterContextType | undefined>(
  undefined
);

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error("useFarcaster must be used within a FarcasterProvider");
  }
  return context;
}

// Keep old hook name for backwards compatibility
export function useFrame() {
  return useFarcaster();
}

export function FarcasterProvider({
  addMiniAppOnLoad,
  children,
}: {
  addMiniAppOnLoad?: boolean;
  children: ReactNode;
}) {
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isMiniAppReady, setIsMiniAppReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<
    MiniAppHostCapability[] | null
  >(null);

  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const loadMiniApp = useCallback(async () => {
    try {
      // first thing first, call ready on the miniapp sdk
      await miniappSdk.actions.ready();

      // check if the app is in the miniapp
      const tmpIsInMiniApp = await miniappSdk.isInMiniApp();
      setIsInMiniApp(tmpIsInMiniApp);

      // then get the context
      const tmpContext = await miniappSdk.context;

      // if the context is not null, set the context
      if (tmpContext) {
        setContext(tmpContext as MiniAppContext);
        // then get the safe area insets
        if (tmpContext.client.safeAreaInsets) {
          setSafeAreaInsets(tmpContext.client.safeAreaInsets);
        }
        setIsMiniAppReady(true);

        if (addMiniAppOnLoad) {
          await miniappSdk.actions.addMiniApp();
        }

        try {
          const tmpCapabilities = await miniappSdk.getCapabilities();
          setCapabilities(tmpCapabilities);
        } catch (err) {
          console.error("Failed to get capabilities", err);
          setError(
            err instanceof Error ? err.message : "Failed to get capabilities"
          );
        }
      } else {
        setError("Failed to load Farcaster context");
        setIsInMiniApp(false);
      }
    } catch (err) {
      console.error("SDK initialization error:", err);
      setError(err instanceof Error ? err.message : "Failed to initialize SDK");
    }
  }, [addMiniAppOnLoad]);

  const handleAddMiniApp = useCallback(async () => {
    try {
      const result = await miniappSdk.actions.addMiniApp();
      if (result) {
        return result;
      }
      return null;
    } catch (error1) {
      console.error("[error] adding miniapp", error1);
      return null;
    }
  }, []);

  useEffect(() => {
    // on load, set the miniapp as ready
    if (
      isMiniAppReady &&
      context &&
      !context?.client?.added &&
      addMiniAppOnLoad
    ) {
      handleAddMiniApp();
    }
  }, [
    isMiniAppReady,
    context?.client?.added,
    handleAddMiniApp,
    addMiniAppOnLoad,
    context,
  ]);

  useEffect(() => {
    if (!isMiniAppReady) {
      loadMiniApp().then(() => {
        console.log("MiniApp loaded");
      });
    }
  }, [isMiniAppReady, loadMiniApp]);

  return (
    <FarcasterContext.Provider
      value={{
        isInMiniApp,
        isMiniAppReady,
        context,
        capabilities,
        safeAreaInsets,
        error,
      }}
    >
      <FrameWalletProvider>{children}</FrameWalletProvider>
    </FarcasterContext.Provider>
  );
}

// Keep old name for backwards compatibility
export const FrameProvider = FarcasterProvider;
