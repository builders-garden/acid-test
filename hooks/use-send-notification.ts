import { useApiMutation } from "./use-api-mutation";

interface SendNotificationVariables {
  title: string;
  text: string;
  delay: number;
  fids: number[];
}

export const useSendNotification = () => {
  return useApiMutation<void, SendNotificationVariables>({
    url: "/api/manual-notification",
    method: "POST",
    isProtected: false,
    body: (variables) => ({
      title: variables.title,
      text: variables.text,
      delay: variables.delay,
      fids: variables.fids,
    }),
  });
};
