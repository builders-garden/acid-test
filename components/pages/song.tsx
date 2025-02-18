import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";

const SongComponent = dynamic(() => import("@/components/Song"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

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
