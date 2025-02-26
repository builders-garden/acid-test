import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { sdk } from "@farcaster/frame-sdk";
import { MiniKit } from "@worldcoin/minikit-js";
import { useCallback, useState } from "react";
import { ContextType, useMiniAppContext } from "./use-miniapp-context";

export const useSignIn = () => {
  const { type: contextType, context } = useMiniAppContext();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!context) {
        throw new Error("No context found");
      }

      if (contextType === ContextType.Farcaster && !context.user?.fid) {
        throw new Error(
          "No FID found. Please make sure you're logged into Warpcast."
        );
      }
      let referrerFid: number | null = null;
      let result: { message: string; signature: string; address?: string };
      if (contextType === ContextType.Worldcoin) {
        const nonce = Math.random().toString(36).substring(2);
        const message = `Sign in to MiniApp. Nonce: ${nonce}`;
        const miniKitResult = await MiniKit.commandsAsync.signMessage({
          message,
        });
        if (miniKitResult.finalPayload.status !== "success") {
          throw new Error("[MiniKit] Failed to sign message");
        }
        result = {
          message: miniKitResult.commandPayload!.message,
          signature: miniKitResult.finalPayload.signature,
          address: miniKitResult.finalPayload.address,
        };
      } else {
        result = await sdk.actions.signIn({
          nonce: Math.random().toString(36).substring(2),
          notBefore: new Date().toISOString(),
          expirationTime: new Date(
            Date.now() + MESSAGE_EXPIRATION_TIME
          ).toISOString(),
        });
        referrerFid =
          context.location?.type === "cast_embed"
            ? context.location.cast.fid
            : null;
      }

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          ...(contextType === ContextType.Farcaster && {
            fid: context.user.fid,
          }),
          ...(result.address && { walletAddress: result.address }),
          referrerFid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData);
        throw new Error(errorData.message || "Sign in failed");
      }

      const data = await res.json();
      setIsSignedIn(true);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, contextType]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setIsSignedIn(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  return { signIn, logout, isSignedIn, isLoading, error };
};
