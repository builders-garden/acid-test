import { useApiQuery } from "./use-api-query";
import { DbSongWithCollectors } from "@/lib/types";

interface SongSummary {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  feat: any;
  totalMints: number;
}

interface RedactedSong {
  id: number;
  createdAt: number;
}

interface SongsSummaryResponse {
  songs: SongSummary[];
  redactedSongs: RedactedSong[];
}

// Get all songs with collectors
export const useGetSongs = () => {
  return useApiQuery<DbSongWithCollectors[]>({
    url: "/api/songs",
    queryKey: ["songs"],
    isProtected: false,
  });
};

// Get songs summary (optimized endpoint)
export const useGetSongsSummary = () => {
  return useApiQuery<SongsSummaryResponse>({
    url: "/api/songs/summary",
    queryKey: ["songs", "summary"],
    isProtected: false,
  });
};
