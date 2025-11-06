import { useMutation, UseMutationOptions } from "@tanstack/react-query";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface UseApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn"> {
  url: string | ((variables: TVariables) => string);
  method?: HttpMethod;
  isProtected?: boolean;
  body?: (variables: TVariables) => unknown;
}

export const useApiMutation = <TData, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables>
) => {
  const {
    url,
    method = "POST",
    isProtected = true,
    ...mutationOptions
  } = options;

  return useMutation<TData, Error, TVariables>({
    ...mutationOptions,
    mutationFn: async (variables) => {
      const token = localStorage.getItem("auth_token");
      const resolvedUrl = typeof url === "function" ? url(variables) : url;
      const resolvedBody = options.body ? options.body(variables) : null;
      const response = await fetch(resolvedUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(isProtected && { Authorization: `Bearer ${token}` }),
        },
        ...(resolvedBody ? { body: JSON.stringify(resolvedBody) } : {}),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Check if response has JSON content
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      }

      // For non-JSON responses, return text or void
      const text = await response.text();
      return text
        ? (text as unknown as TData)
        : (undefined as unknown as TData);
    },
  });
};
