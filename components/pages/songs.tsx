"use client";

import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import SongsComponent from "@/components/Songs";

export default function Songs() {
  const { type: contextType, context } = useMiniAppContext();
  return contextType === ContextType.Farcaster ? (
    <SafeAreaContainer insets={context.client.safeAreaInsets}>
      <SongsComponent />
    </SafeAreaContainer>
  ) : (
    <SafeAreaContainer>
      <SongsComponent />
    </SafeAreaContainer>
  );
}
