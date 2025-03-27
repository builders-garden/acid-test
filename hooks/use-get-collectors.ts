import { DbCollection } from "@/lib/types";
import { useApiQuery } from "./use-api-query";

export const useCollectors = (songId: number) => {
  const { data, isLoading, refetch } = useApiQuery<DbCollection[]>({
    queryKey: ["collectors", songId],
    url: `/api/collection/${songId}`,
    isProtected: true,
  });

  return { collectors: data, isLoading, refetch };
};
