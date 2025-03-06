"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "../header";

export default function Home() {
  const { signIn, isLoading, isSignedIn } = useSignIn();
  const [testResult, setTestResult] = useState<string>("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  const addTestUser = async () => {
    try {
      setIsAddingUser(true);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(
          `User added successfully: ${JSON.stringify(data.user, null, 2)}`
        );
      } else {
        setTestResult(`Error adding user: ${data.error}`);
      }
    } catch (error) {
      setTestResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsAddingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      <Header />

      <div className="w-full max-w-md flex flex-col items-center space-y-6 mt-8">
        <div className="text-center space-y-4 w-full">
          <h1 className="text-xl font-bold">Welcome</h1>
          <p className="text-sm text-white/60">
            {isSignedIn ? "You are signed in!" : "Sign in to get started"}
          </p>

          {!isSignedIn ? (
            <Button
              variant="outline"
              onClick={signIn}
              disabled={isLoading}
              className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          ) : (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={addTestUser}
                disabled={isAddingUser}
                className="w-full h-12 text-lg border-2 border-green-500 bg-transparent text-green-500 hover:bg-green-500/20 transition-colors"
              >
                {isAddingUser ? "Adding User..." : "Add Test User"}
              </Button>

              {testResult && (
                <div className="mt-4 p-4 rounded-none border-2 border-white/20 bg-black text-white text-sm">
                  <pre className="whitespace-pre-wrap">{testResult}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {isSignedIn && (
          <div className="flex flex-col space-y-4 w-full">
            <Link
              href="/songs"
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black transition-colors"
              >
                SONGS
              </Button>
            </Link>

            <Link
              href="/admin"
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full h-12 text-lg border-2 border-white/60 bg-transparent text-white hover:bg-white/20 transition-colors"
              >
                ADMIN PANEL
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
