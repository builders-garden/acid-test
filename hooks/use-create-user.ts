import { useApiMutation } from "./use-api-mutation";

interface CreateUserVariables {
  fid: number;
}

export const useCreateUser = () => {
  return useApiMutation<void, CreateUserVariables>({
    url: "/api/user",
    method: "POST",
    isProtected: false,
    body: (variables) => ({
      fid: variables.fid,
    }),
  });
};
