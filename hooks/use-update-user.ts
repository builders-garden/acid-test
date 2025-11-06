import { useApiMutation } from "./use-api-mutation";

interface UpdateUserVariables {
  fid: number;
  notificationDetails?: {
    url: string;
    token: string;
  };
}

interface UpdateUserResponse {
  success: boolean;
}

export const useUpdateUser = () => {
  return useApiMutation<UpdateUserResponse, UpdateUserVariables>({
    url: "/api/user",
    method: "POST",
    isProtected: false,
    body: (variables) => variables,
  });
};
