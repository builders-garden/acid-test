import { useApiQuery } from "./use-api-query";
import { useApiMutation } from "./use-api-mutation";

interface PrelaunchState {
  isPrelaunch: boolean;
}

export const usePrelaunchState = () => {
  const { data, isLoading, error, refetch } = useApiQuery<PrelaunchState>({
    queryKey: ["prelaunchState"],
    url: "/api/state",
    isProtected: true,
  });

  const mutation = useApiMutation<PrelaunchState, { isPrelaunch: boolean }>({
    url: "/api/state",
    method: "POST",
    body: (variables) => variables,
    onSuccess: () => {
      refetch();
    },
  });

  const toggleState = async () => {
    if (data) {
      await mutation.mutateAsync({ isPrelaunch: !data.isPrelaunch });
    }
  };

  return {
    isPrelaunch: data?.isPrelaunch ?? true,
    isLoading: isLoading || mutation.isPending,
    error: error?.message ?? mutation.error?.message ?? null,
    toggleState,
  };
};
