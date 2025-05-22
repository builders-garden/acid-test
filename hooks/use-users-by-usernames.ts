import { useApiQuery } from "./use-api-query";

interface UserData {
  username: string;
  fid: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  success: boolean;
}

interface FetchUsersResponse {
  users: UserData[];
}

export function useUsersByUsernames(
  usernames: string[] | null,
  enabled = true
) {
  return useApiQuery<FetchUsersResponse>({
    queryKey: ["users-by-usernames", usernames?.join(",")],
    url: "/api/neynar/users",
    method: "POST",
    body: { usernames },
    enabled: enabled && !!usernames && usernames.length > 0,
  });
}
