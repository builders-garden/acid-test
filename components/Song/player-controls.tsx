import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import Image from "next/image";

type PlayerControlsProps = {
  metadata: any | null;
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
  metadata,
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
  return (
    <>
      {/* CD Visualization */}
      <div className="w-full max-w-lg aspect-square bg-black border border-white/80 rounded-lg mb-6 relative overflow-hidden">
        {metadata?.image && (
          <div className="absolute inset-0">
            <Image
              src={metadata.image}
              alt="Song artwork"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        {/* Play/Pause button */}
        <Button
          className={`absolute bottom-4 right-4 w-14 h-14 ${
            !isPlaying
              ? "bg-mint text-black hover:hover:bg-plum"
              : "bg-plum text-black hover:bg-plum/90"
          } flex items-center justify-center p-0`}
          onClick={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin h-8 w-8 border-2 border-black rounded-full border-t-transparent" />
          ) : isCurrentSong && isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current" />
          )}
        </Button>
      </div>

      {/* Audio Controls */}
      {(displayTime > 0 || isPlaying) && (
        <div className="w-full max-w-md space-y-2 mb-6">
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
        </div>
      )}
    </>
  );
};
