import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";
import { LoadingScreen } from "../loading-screen";

const SongsComponent = dynamic(() => import("@/components/Songs"), {
  ssr: false,
  loading: () => <LoadingScreen />,
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
