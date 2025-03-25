"use client";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";

export default function Home() {
  const { type: contextType, context, actions } = useMiniAppContext();

  const handlePresave = async () => {
    if (contextType === ContextType.Farcaster) {
      if (!context.client.added && actions) {
        await actions.addFrame();
        // add to db
      }
    }
  };

  return (
    <>
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Presave</h1>
        <p className="text-lg text-muted-foreground">
          Presave to be added to the waitlist
        </p>
        <button
          onClick={handlePresave}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Presave
        </button>
      </div>
    </div>
    </>

  );
}
