import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { sdk } from "@farcaster/frame-sdk";
import { MiniKit } from "@worldcoin/minikit-js";
import { useCallback, useState, useEffect } from "react";
import { ContextType, useMiniAppContext } from "./use-miniapp-context";
import posthog from "posthog-js";

const ADMINS = [
  1504, // chaim
  5698, // caso
  266506, // drone
  16286, // frank
  978372, // acid test
];

export const useSignIn = () => {
  const { type: contextType, context } = useMiniAppContext();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signinIn, setSigninIn] = useState(false);

  useEffect(() => {
    if (contextType === ContextType.Farcaster) {
      if (context?.user?.fid && ADMINS.includes(context.user.fid)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }
  }, [contextType, context]);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        // Make a request to a protected endpoint to verify the token
        const res = await fetch("/api/auth/verify", {
          credentials: "include",
        });

        if (res.ok) {
          setIsSignedIn(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        // Don't update isSignedIn, leave as false
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSignedIn) {
      checkAuthToken();
    }
  }, [isSignedIn]);

  const signIn = useCallback(async () => {
    try {
      setError(null);
      setSigninIn(true);
      setIsLoading(true);

      if (!context) {
        throw new Error("No context found");
      }

      if (contextType === ContextType.Farcaster && !context.user?.fid) {
        throw new Error(
          "No FID found. Please make sure you're logged into Warpcast."
        );
      }
      let result: { message: string; signature: string; address?: string };
      const nonce = Math.random().toString(36).substring(2);
      if (contextType === ContextType.Worldcoin) {
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
          nonce,
          notBefore: new Date().toISOString(),
          expirationTime: new Date(
            Date.now() + MESSAGE_EXPIRATION_TIME
          ).toISOString(),
          acceptAuthAddress: true,
        });
      }

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nonce,
          signature: result.signature,
          message: result.message,
          ...(result.address && { walletAddress: result.address }),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData);
        throw new Error(errorData.message || "Sign in failed");
      }

      const data = await res.json();
      setIsSignedIn(true);
      if (contextType === ContextType.Farcaster) {
        posthog.identify(context?.user?.fid.toString());
      }
      setIsLoading(false);
      setSigninIn(false);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      setIsLoading(false);
      setSigninIn(false);
      throw err;
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

  return { signIn, logout, isSignedIn, isLoading, error, isAdmin, signinIn };
};
