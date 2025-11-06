import { DbCollection } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useApiQuery } from "./use-api-query";

export const useCollectors = (songId: number) => {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["collectors", songId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/collection/${songId}?cursor=${pageParam}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch collectors");
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  return {
    collectors: data?.pages.flatMap((page) => page.items) ?? [],
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    total: data?.pages[0]?.total ?? 0,
  };
};

export const useUserCollector = (songId: number, fid: number | null) => {
  return useApiQuery<{
    collection: DbCollection | null;
    position: number | null;
  }>({
    queryKey: ["userCollector", songId, fid],
    url: `/api/collection/${songId}/collector?fid=${fid}`,
    enabled: !!fid,
  });
};

export const useTotalMints = (songId?: number) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["totalMints", songId],
    queryFn: async () => {
      if (!songId) return 0;
      const response = await fetch(`/api/collection/${songId}?cursor=0`);
      if (!response.ok) {
        throw new Error("Failed to fetch total mints");
      }
      const data = await response.json();
      return data.totalMints ?? 0;
    },
    enabled: !!songId,
  });

  return {
    totalMints: data ?? 0,
    isLoading,
    refetch,
  };
};
