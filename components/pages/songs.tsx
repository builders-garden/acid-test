import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";

const SongsComponent = dynamic(() => import("@/components/Songs"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

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
