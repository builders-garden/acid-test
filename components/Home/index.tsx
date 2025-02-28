"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const { signIn, isLoading, isSignedIn, logout } = useSignIn();
  const [testResult, setTestResult] = useState<string>("");

  const testAuth = async () => {
    try {
      const res = await fetch("/api/test", {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setTestResult(`Auth test failed: ${data.error}`);
        return;
      }

      setTestResult(`Auth test succeeded! Server response: ${data.message}`);
    } catch (error) {
      setTestResult(
        "Auth test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome</h1>
        <p className="text-lg text-muted-foreground">
          {isSignedIn ? "You are signed in!" : "Sign in to get started"}
        </p>

        {!isSignedIn ? (
          <button
            onClick={signIn}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        ) : (
          <div className="space-y-4">
            <button
              onClick={testAuth}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
            >
              Test Authentication
            </button>

            <button
              onClick={logout}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200 block w-full"
            >
              Sign Out
            </button>

            {testResult && (
              <div className="mt-4 p-4 rounded-lg bg-gray-100 text-black text-sm">
                {testResult}
              </div>
            )}
          </div>
        )}
      </div>

      <Link href="/admin">
        <button className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200">
          Admin Panel
        </button>
      </Link>

      <Link href="/songs">
        <button className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200">
          Songs
        </button>
      </Link>

      <Link
        href="/presave"
        className="text-lg text-muted-foreground mt-4"
      >
        Presave
      </Link>
    </div>
  );
}
