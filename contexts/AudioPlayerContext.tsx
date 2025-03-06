"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { SongMetadata } from "@/types";

interface AudioPlayerContextType {
  isPlaying: boolean;
  currentSong: {
    metadata: SongMetadata | null;
    tokenId: number | null;
  };
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  play: (metadata: SongMetadata, tokenId: number) => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  resetPlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider"
    );
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<{
    metadata: SongMetadata | null;
    tokenId: number | null;
  }>({
    metadata: null,
    tokenId: null,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const play = (metadata: SongMetadata, tokenId: number) => {
    if (!audioRef.current) return;

    // If we're playing a different song, load the new one
    if (currentSong.metadata?.animation_url !== metadata.animation_url) {
      audioRef.current.src = metadata.animation_url;
      audioRef.current.load();
      setCurrentSong({ metadata, tokenId });
    }

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error("Error playing audio:", error);
      });
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else if (currentSong.metadata) {
      play(currentSong.metadata, currentSong.tokenId || 0);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const resetPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentSong({ metadata: null, tokenId: null });
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        currentSong,
        currentTime,
        duration,
        audioRef,
        play,
        pause,
        toggle,
        seek,
        resetPlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
