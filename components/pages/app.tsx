"use client";

import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import HomePage from "@/components/Home";

export default function App() {
  const { type: contextType, context } = useMiniAppContext();
  return contextType === ContextType.Farcaster ? (
    <SafeAreaContainer insets={context.client.safeAreaInsets}>
      <HomePage />
    </SafeAreaContainer>
  ) : (
    <SafeAreaContainer>
      <HomePage />
    </SafeAreaContainer>
  );
}
