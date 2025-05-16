import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import Image from "next/image";

type PlayerControlsProps = {
  isLoading: boolean;
  isPlaying: boolean;
  isCurrentSong: boolean;
  handlePlayPause: () => void;
  displayTime: number;
  displayDuration: number;
  handleSliderValueChange: (value: number[]) => void;
  handleSliderCommit: (value: number[]) => void;
  formatTime: (time: number) => string;
};

export const PlayerControls = ({
  isLoading,
  isPlaying,
  isCurrentSong,
  handlePlayPause,
  displayTime,
  displayDuration,
  handleSliderValueChange,
  handleSliderCommit,
  formatTime,
}: PlayerControlsProps) => {
  const backwardControls = useAnimationControls();
  const forwardControls = useAnimationControls();

  const handleSkipBack = () => {
    if (!isCurrentSong) return;
    handleSliderCommit([Math.max(0, displayTime - 10)]);
  };

  const handleSkipForward = () => {
    if (!isCurrentSong) return;
    handleSliderCommit([Math.min(displayDuration, displayTime + 10)]);
  };

  const handleBackwardClick = () => {
    if (!isCurrentSong) return;
    handleSkipBack();
  };

  const handleForwardClick = () => {
    if (!isCurrentSong) return;
    handleSkipForward();
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 mt-1">
      {/* Play Controls */}
      <div className="flex justify-center items-center gap-12">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            onClick={handleBackwardClick}
            className="w-10 h-10 rounded-full bg-black text-white hover:text-white/80 active:text-white/60 flex items-center justify-center p-0 relative"
            disabled={!isCurrentSong}
          >
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[13px] font-bold text-white drop-shadow-sm">
                10
              </span>
            </span>
            <Image
              src="/images/rotate-back.webp"
              alt="Rotate Back"
              width={35}
              height={35}
              className="absolute invert"
              priority
            />
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center p-0 hover:bg-transparent"
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin h-12 w-12 border-2 border-white hover:border-white/80 active:border-white/60 rounded-full border-t-transparent" />
            ) : (
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.div
                  key={isCurrentSong && isPlaying ? "pause" : "play"}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.05 }}
                >
                  {isCurrentSong && isPlaying ? (
                    <Pause className="!w-12 !h-12 fill-current" />
                  ) : (
                    <Play className="!w-12 !h-12 fill-current" />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            onClick={handleForwardClick}
            className="w-10 h-10 rounded-full bg-black text-white hover:text-white/80 active:text-white/60 flex items-center justify-center p-0 relative"
            disabled={!isCurrentSong}
          >
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[13px] font-bold text-white drop-shadow-sm">
                10
              </span>
            </span>
            <Image
              src="/images/rotate-forward.webp"
              alt="Rotate Forward"
              width={35}
              height={35}
              className="absolute invert"
              priority
            />
          </Button>
        </motion.div>
      </div>

      {/* Audio Controls */}
      <motion.div
        className="w-full space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Slider
          value={[isCurrentSong ? displayTime : 0]}
          max={isCurrentSong ? displayDuration || 100 : 100}
          step={0.1}
          onValueChange={handleSliderValueChange}
          onValueCommit={handleSliderCommit}
          className="cursor-pointer"
          disabled={!isCurrentSong}
        />
        <div className="flex justify-between text-xs text-white">
          <span>{isCurrentSong ? formatTime(displayTime) : "0:00"}</span>
          <span>{isCurrentSong ? formatTime(displayDuration) : "0:00"}</span>
        </div>
      </motion.div>
    </div>
  );
};
