import { SafeAreaContainer } from "@/components/safe-area-container";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import dynamic from "next/dynamic";

const AdminComponent = dynamic(() => import("@/components/Admin"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Admin() {
  const { type: contextType, context } = useMiniAppContext();
  return contextType === ContextType.Farcaster ? (
    <SafeAreaContainer insets={context.client.safeAreaInsets}>
      <AdminComponent />
    </SafeAreaContainer>
  ) : (
    <SafeAreaContainer>
      <AdminComponent />
    </SafeAreaContainer>
  );
}
