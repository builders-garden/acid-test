import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";

const HomePage = dynamic(() => import("@/components/Home"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Home() {
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
