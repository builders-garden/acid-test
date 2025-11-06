import { useApiMutation } from "./use-api-mutation";

interface CreateRedactedSongResponse {
  success: boolean;
  id: number;
}

interface UnveilRedactedSongVariables {
  id: number;
}

interface UnveilRedactedSongResponse {
  success: boolean;
}

// Create a new redacted song placeholder
export const useCreateRedactedSong = () => {
  return useApiMutation<CreateRedactedSongResponse, void>({
    url: "/api/redacted-songs",
    method: "POST",
    isProtected: false,
    body: () => ({}),
  });
};

// Unveil a redacted song
export const useUnveilRedactedSong = () => {
  return useApiMutation<
    UnveilRedactedSongResponse,
    UnveilRedactedSongVariables
  >({
    url: "/api/redacted-songs/unveil",
    method: "POST",
    isProtected: false,
    body: (variables) => ({ id: variables.id }),
  });
};
