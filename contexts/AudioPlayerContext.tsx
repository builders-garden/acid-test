"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { SongMetadata } from "@/types";
import { getAudioWithFallback } from "@/lib/utils";

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
  preloadSong: (metadata: SongMetadata) => void;
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
  // Keep a reference to the current error handler for cleanup
  const currentErrorHandler = useRef<((e: Event) => void) | null>(null);

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

      // Clean up any current error handler if it exists
      if (currentErrorHandler.current) {
        audio.removeEventListener("error", currentErrorHandler.current);
        currentErrorHandler.current = null;
      }
    };
  }, []);

  // Helper function to setup audio with fallback mechanism
  const setupAudioWithFallback = (
    audioUrl: string,
    autoplay: boolean = false,
    playingContext?: { metadata: SongMetadata; tokenId: number }
  ) => {
    if (!audioRef.current) return;

    const urls = getAudioWithFallback(audioUrl);

    // Set up a persistent reference to track fallback attempts
    const fallbackState = { currentUrlIndex: 0, urls };

    // Create error handler function for fallback logic
    const handleAudioError = (e: Event) => {
      fallbackState.currentUrlIndex++;
      if (fallbackState.currentUrlIndex < fallbackState.urls.length) {
        console.log(
          `Trying fallback audio URL ${autoplay ? "" : "for preloading "}(${
            fallbackState.currentUrlIndex
          }):`,
          fallbackState.urls[fallbackState.currentUrlIndex]
        );

        if (audioRef.current) {
          audioRef.current.src =
            fallbackState.urls[fallbackState.currentUrlIndex];
          audioRef.current.load();

          // Only try to play if autoplay is requested
          if (autoplay) {
            audioRef.current
              .play()
              .catch((err) =>
                console.error("Error playing fallback audio:", err)
              );
          }
        }
      } else {
        console.error(
          `All audio fallbacks failed${autoplay ? "" : " during preload"}`
        );
      }
    };

    // Clean up previous error handler if it exists
    if (audioRef.current && currentErrorHandler.current) {
      audioRef.current.removeEventListener(
        "error",
        currentErrorHandler.current
      );
    }

    // Store and attach the new error handler
    currentErrorHandler.current = handleAudioError;
    audioRef.current.addEventListener("error", handleAudioError);

    // Set initial URL and load
    audioRef.current.src = urls[0];
    audioRef.current.load();

    // Update current song if in playing context
    if (playingContext) {
      setCurrentSong(playingContext);
    }
  };

  const play = (metadata: SongMetadata, tokenId: number) => {
    if (!audioRef.current) return;

    // If we're playing a different song than the current one
    if (currentSong.metadata?.animation_url !== metadata.animation_url) {
      // Check if the audio element already has this song loaded (from preload)
      const isPreloaded =
        audioRef.current.src &&
        (audioRef.current.src === metadata.animation_url ||
          getAudioWithFallback(metadata.animation_url).includes(
            audioRef.current.src
          ));

      // If not already preloaded, set it up
      if (!isPreloaded) {
        setupAudioWithFallback(metadata.animation_url, true, {
          metadata,
          tokenId,
        });
      } else {
        // Always update the current song when playing
        setCurrentSong({ metadata, tokenId });
      }
    }

    // Play the audio (whether preloaded or newly loaded)
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

      // Remove error handler when resetting
      if (currentErrorHandler.current) {
        audioRef.current.removeEventListener(
          "error",
          currentErrorHandler.current
        );
        currentErrorHandler.current = null;
      }
    }
    setIsPlaying(false);
    setCurrentSong({ metadata: null, tokenId: null });
    setCurrentTime(0);
    setDuration(0);
  };

  const preloadSong = (metadata: SongMetadata) => {
    if (!audioRef.current) return;

    // Only preload if it's a different song than the current one
    if (currentSong.metadata?.animation_url !== metadata.animation_url) {
      console.log("Preloading song:", metadata.name);
      setupAudioWithFallback(metadata.animation_url, false);
      // Don't update currentSong yet, that happens when play is called
    }
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
        preloadSong,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};
