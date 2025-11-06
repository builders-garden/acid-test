import { useApiQuery } from "./use-api-query";
import { DbUser } from "@/lib/types";

interface GetUserResponse {
  data: DbUser | null;
}

export const useGetUser = (enabled: boolean = true) => {
  return useApiQuery<GetUserResponse>({
    url: "/api/user",
    queryKey: ["user"],
    isProtected: false,
    enabled,
  });
};
