import { useApiMutation } from "./use-api-mutation";

interface CreateCollectionVariables {
  userId: number;
  songId: number;
  amount: number;
}

interface CreateCollectionResponse {
  position: number | null;
  amount: number | null;
}

export const useCreateCollection = () => {
  return useApiMutation<CreateCollectionResponse, CreateCollectionVariables>({
    url: "/api/collection",
    method: "POST",
    isProtected: false,
    body: (variables) => ({
      userId: variables.userId,
      songId: variables.songId,
      amount: variables.amount,
    }),
  });
};
