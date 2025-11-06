"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import { handleAddMiniApp } from "@/lib/utils";
import { useFarcaster } from "@/components/farcaster-provider";
import { useUpdateUser } from "@/hooks/use-update-user";
import { useGetUser } from "@/hooks/use-get-user";

interface MiniAppStatusContextType {
  userAddedMiniApp: boolean;
  setUserAddedMiniApp: (value: boolean) => void;
  isLoading: boolean;
  promptToAddMiniApp: () => Promise<void>;
}

const MiniAppStatusContext = createContext<
  MiniAppStatusContextType | undefined
>(undefined);

export const useMiniAppStatus = () => {
  const context = useContext(MiniAppStatusContext);
  if (context === undefined) {
    throw new Error(
      "useMiniAppStatus must be used within a MiniAppStatusProvider"
    );
  }
  return context;
};

export const MiniAppStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userAddedMiniApp, setUserAddedMiniApp] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { type: contextType, context } = useMiniAppContext();
  const { context: farcasterContext, isMiniAppReady } = useFarcaster();

  const updateUserMutation = useUpdateUser();
  const { data: userData } = useGetUser(false); // Don't auto-fetch on mount

  const promptToAddMiniApp = async () => {
    if (userAddedMiniApp || isLoading) return;

    try {
      const notificationDetails = await handleAddMiniApp();
      if (notificationDetails) {
        setUserAddedMiniApp(true);

        // If we have a Farcaster user, save their notification details
        if (contextType === ContextType.Farcaster && context?.user?.fid) {
          try {
            await updateUserMutation.mutateAsync({
              fid: context.user.fid,
              notificationDetails,
            });
          } catch (error) {
            console.error("Failed to save user notification details");
          }
        }
      }
    } catch (error) {
      console.error("Error adding miniapp:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = userData;

        if (result?.data?.notificationDetails) {
          setUserAddedMiniApp(true);
          setIsLoading(false);
          return;
        }

        // Fall back to context check if no notification details
        if (contextType === ContextType.Farcaster && isMiniAppReady) {
          if (farcasterContext && farcasterContext.user.fid) {
            setUserAddedMiniApp(farcasterContext.client.added);
          } else {
            setUserAddedMiniApp(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fall back to context check on error
        if (contextType === ContextType.Farcaster && isMiniAppReady) {
          if (farcasterContext && farcasterContext.user.fid) {
            setUserAddedMiniApp(farcasterContext.client.added);
          } else {
            setUserAddedMiniApp(false);
          }
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [contextType, farcasterContext, isMiniAppReady, userData]);

  return (
    <MiniAppStatusContext.Provider
      value={{
        userAddedMiniApp,
        setUserAddedMiniApp,
        isLoading,
        promptToAddMiniApp,
      }}
    >
      {children}
    </MiniAppStatusContext.Provider>
  );
};
