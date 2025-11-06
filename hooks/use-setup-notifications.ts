import { useApiMutation } from "./use-api-mutation";

interface SetupNotificationsVariables {
  title: string;
  startDate: number;
  endDate: number;
  price: number;
  tokenId: number;
}

interface SetupNotificationsResponse {
  message: string;
  data: {
    title: string;
    tokenId: string;
    timestamp: string;
  };
}

export const useSetupNotifications = () => {
  return useApiMutation<
    SetupNotificationsResponse,
    SetupNotificationsVariables
  >({
    url: "/api/setup-notifications",
    method: "POST",
    isProtected: false,
    body: (variables) => ({
      title: variables.title,
      startDate: variables.startDate.toString(),
      endDate: variables.endDate.toString(),
      price: variables.price.toString(),
      tokenId: variables.tokenId.toString(),
    }),
  });
};
