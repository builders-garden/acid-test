import { DbCollection } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

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
