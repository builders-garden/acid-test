"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "../header";
import sdk from "@farcaster/frame-sdk";

export default function Home() {
  const { signIn, isLoading, isSignedIn } = useSignIn();

  const handleAddFrame = () => {
    try {
      sdk.actions.addFrame();
    } catch (error) {
      console.error("Error adding frame:", error);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-mono p-4 flex flex-col items-center w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/presave_bg.svg')`,
          backgroundSize: "85%",
          backgroundPosition: "center top -17px",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-20 w-full">
        <Header />

        <div className="w-full max-w-md flex flex-col items-center space-y-6 mt-8 p-4 py-6 rounded-xl backdrop-blur-sm">
          <div className="text-center space-y-4 w-full">
            <h1 className="text-xl font-bold">Welcome</h1>
            <p className="text-sm text-white/60">
              {isSignedIn ? "You are signed in!" : "Sign in to get started"}
            </p>

            {!isSignedIn && (
              <Button
                onClick={signIn}
                disabled={isLoading}
                className="w-full h-12 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            )}
          </div>

          {isSignedIn && (
            <div className="flex flex-col space-y-4 w-full">
              <Link
                href="/songs"
                className="w-full"
              >
                <Button className="w-full h-12 text-lg bg-mint text-black hover:bg-plum hover:text-black transition-colors">
                  SONGS
                </Button>
              </Link>

              <Link
                href="/admin"
                className="w-full"
              >
                <Button className="w-full h-12 text-lg bg-mint text-black hover:bg-plum transition-colors">
                  ADMIN PANEL
                </Button>
              </Link>

              <Button
                onClick={handleAddFrame}
                className="w-full h-12 text-lg bg-mint text-black hover:bg-plum transition-colors"
              >
                ADD FRAME
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
