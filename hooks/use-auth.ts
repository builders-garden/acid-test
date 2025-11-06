import { useApiMutation } from "./use-api-mutation";
import { useApiQuery } from "./use-api-query";

interface SignInVariables {
  nonce: string;
  signature: string;
  message: string;
  fid?: number;
  walletAddress?: string;
}

interface SignInResponse {
  success: boolean;
}

// Verify auth token
export const useVerifyAuth = () => {
  return useApiQuery<{ authenticated: boolean }>({
    url: "/api/auth/verify",
    queryKey: ["auth", "verify"],
    isProtected: false,
    staleTime: 0, // Always check fresh
  });
};

// Sign in mutation
export const useSignIn = () => {
  return useApiMutation<SignInResponse, SignInVariables>({
    url: "/api/auth/sign-in",
    method: "POST",
    isProtected: false,
    body: (variables) => variables,
  });
};

// Logout mutation
export const useLogout = () => {
  return useApiMutation<void, void>({
    url: "/api/auth/logout",
    method: "POST",
    isProtected: false,
    body: () => ({}),
  });
};
