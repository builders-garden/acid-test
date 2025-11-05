"use client";

import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import SongComponent from "@/components/Song";

export default function Song() {
  const { type: contextType, context } = useMiniAppContext();
  return contextType === ContextType.Farcaster ? (
    <SafeAreaContainer insets={context.client.safeAreaInsets}>
      <SongComponent />
    </SafeAreaContainer>
  ) : (
    <SafeAreaContainer>
      <SongComponent />
    </SafeAreaContainer>
  );
}
