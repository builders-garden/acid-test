"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import { handleAddFrame } from "@/lib/utils";
import { toast } from "sonner";

interface FrameStatusContextType {
  userAddedFrame: boolean;
  setUserAddedFrame: (value: boolean) => void;
  isLoading: boolean;
  promptToAddFrame: () => Promise<void>;
}

const FrameStatusContext = createContext<FrameStatusContextType | undefined>(
  undefined
);

export const useFrameStatus = () => {
  const context = useContext(FrameStatusContext);
  if (context === undefined) {
    throw new Error("useFrameStatus must be used within a FrameStatusProvider");
  }
  return context;
};

export const FrameStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userAddedFrame, setUserAddedFrame] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { type: contextType, context } = useMiniAppContext();

  const promptToAddFrame = async () => {
    if (userAddedFrame || isLoading) return;

    try {
      const notificationDetails = await handleAddFrame();
      if (notificationDetails) {
        setUserAddedFrame(true);

        // If we have a Farcaster user, save their notification details
        if (contextType === ContextType.Farcaster && context?.user?.fid) {
          const response = await fetch("/api/user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fid: context.user.fid,
              notificationDetails,
            }),
          });

          if (!response.ok) {
            console.error("Failed to save user notification details");
          }
        }
      }
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        const result = await response.json();

        if (result?.data?.notificationDetails) {
          setUserAddedFrame(true);
          setIsLoading(false);
          return;
        }

        // Fall back to context check if no notification details
        if (contextType === ContextType.Farcaster) {
          if (context && context.user.fid) {
            setUserAddedFrame(context.client.added);
          } else {
            setUserAddedFrame(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fall back to context check on error
        if (contextType === ContextType.Farcaster) {
          if (context && context.user.fid) {
            setUserAddedFrame(context.client.added);
          } else {
            setUserAddedFrame(false);
          }
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [contextType, context]);

  return (
    <FrameStatusContext.Provider
      value={{ userAddedFrame, setUserAddedFrame, isLoading, promptToAddFrame }}
    >
      {children}
    </FrameStatusContext.Provider>
  );
};
