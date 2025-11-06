import { useApiMutation } from "./use-api-mutation";

interface CreateSongVariables {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  feat?: string;
}

interface CreateSongResponse {
  success: boolean;
}

export const useCreateSong = () => {
  return useApiMutation<CreateSongResponse, CreateSongVariables>({
    url: "/api/song",
    method: "POST",
    isProtected: false,
    body: (variables) => ({
      tokenId: variables.id, // Map 'id' to 'tokenId' for the API
      title: variables.title,
      startDate: variables.startDate,
      endDate: variables.endDate,
      feat: variables.feat,
    }),
  });
};
