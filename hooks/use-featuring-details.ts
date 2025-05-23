import { useMemo } from "react";
import { useApiQuery } from "./use-api-query";
import { getFallbackFeaturingDetails } from "@/lib/utils";

interface FeatUser {
  username: string;
  pfp: string;
  fid: number;
}

interface FeaturingDetails {
  users: FeatUser[];
  text?: string;
}

interface FeaturingResponse {
  success: boolean;
  data: FeaturingDetails | null;
}

export const useFeaturingDetails = (songId: number | undefined) => {
  const query = useApiQuery<FeaturingResponse>({
    queryKey: ["featuring", songId],
    url: `/api/song/featuring?id=${songId}`,
    enabled: !!songId,
  });

  // Return featuring details from API response or fallback
  const featuringDetails = useMemo(() => {
    // If we're still loading, return undefined for loading state
    if (query.isLoading) {
      return undefined;
    }

    // If we have API data, use it
    if (query.data?.data) {
      return query.data.data;
    }

    // Otherwise use fallback data if we have a songId
    return songId ? getFallbackFeaturingDetails(songId) : undefined;
  }, [query.data?.data, query.isLoading, songId]);

  return {
    ...query,
    data: featuringDetails ? { success: true, data: featuringDetails } : undefined
  };
};
