import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";

const AboutComponent = dynamic(() => import("@/components/About"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function About() {
  const { type: contextType, context } = useMiniAppContext();
  return contextType === ContextType.Farcaster ? (
    <SafeAreaContainer insets={context.client.safeAreaInsets}>
      <AboutComponent />
    </SafeAreaContainer>
  ) : (
    <SafeAreaContainer>
      <AboutComponent />
    </SafeAreaContainer>
  );
}
