"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import { useEffect } from "react";
import { LoadingScreen } from "./ui/loading-screen";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { signIn, isSignedIn, isLoading, error, signinIn } = useSignIn();

  useEffect(() => {
    if (!isSignedIn && !isLoading && !signinIn) {
      signIn();
    }
  }, [isSignedIn, isLoading, signIn, signinIn]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-black text-white flex flex-col gap-2 items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return children;
};
