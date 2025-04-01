"use client";

import { useEffect, useState } from "react";
import { BellIcon, ClockIcon, MusicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { Switch } from "@/components/ui/switch";
import { DbSongWithCollectors } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationFormProps {
  setModalOpen: (open: boolean) => void;
  setModalStatus: (status: "loading" | "success" | "error") => void;
  setModalMessage: (message: string) => void;
}

export default function NotificationForm({
  setModalOpen,
  setModalStatus,
  setModalMessage,
}: NotificationFormProps) {
  const { type: contextType, context } = useMiniAppContext();
  const [songsAndCollectors, setSongsAndCollectors] = useState<
    DbSongWithCollectors[]
  >([]);
  const [selectedSongId, setSelectedSongId] = useState<string>("All");
  const [nCollectors, setNCollectors] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    delay: 0,
  });

  const [productionMode, setProductionMode] = useState(false);

  useEffect(() => {
    const fetchSongsAndCollectors = async () => {
      const response = await fetch("/api/songs");
      const data = await response.json();
      if (response.ok) {
        setSongsAndCollectors(data);
      } else {
        console.error("Failed to fetch songs and collectors:", data.error);
      }
    };
    fetchSongsAndCollectors();
  }, []);

  const handleSongSelect = (songId: string) => {
    setSelectedSongId(songId);

    const selectedSong = songsAndCollectors.find(
      (song) => song.id === parseInt(songId)
    );
    if (selectedSong && selectedSong.collectors) {
      setNCollectors(selectedSong.collectors.length);
    } else {
      setNCollectors(0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "delay") {
      const numValue = parseInt(value);
      if (numValue < 0) return;

      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalOpen(true);
    setModalStatus("loading");
    setModalMessage("Sending notification...");

    if (contextType !== "farcaster" || !context?.user?.fid) {
      setModalStatus("error");
      setModalMessage(
        "No FID found. Please make sure you're logged into Warpcast."
      );
      return;
    }

    try {
      const body = {
        title: formData.title,
        text: formData.body,
        delay: formData.delay,
        ...(productionMode
          ? selectedSongId !== "All"
            ? { songId: Number(selectedSongId) }
            : {}
          : { fid: context.user.fid }),
      };

      const response = await fetch("/api/manual-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }

      setModalStatus("success");
      setModalMessage(
        `Notification scheduled successfully in ${
          productionMode ? "production" : "test"
        } mode ${
          selectedSongId && productionMode ? `to ${nCollectors} collectors` : ""
        }`
      );

      setFormData({
        title: "",
        body: "",
        delay: 0,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      setModalStatus("error");
      setModalMessage("Failed to send notification");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-4"
    >
      <div className="flex flex-col gap-2 items-start justify-between p-2 border-2 border-white/60 bg-black text-white">
        <div className="flex w-full justify-between">
          <span className="font-medium">
            Mode: {productionMode ? "Production" : "Test"}
          </span>

          <div className="flex items-center gap-2">
            <span>Test</span>
            <Switch
              checked={productionMode}
              onCheckedChange={setProductionMode}
              className="data-[state=checked]:bg-red-500"
            />
            <span>Prod</span>
          </div>
        </div>
        <span className="text-xs text-white/70">
          {productionMode
            ? selectedSongId
              ? `Notification will be sent to ${nCollectors} collectors of the selected song`
              : "Notification will be sent to ALL users"
            : "Notification will be sent only to your FID"}
        </span>
      </div>

      {productionMode && (
        <div>
          <label
            htmlFor="song"
            className="block mb-1 text-sm text-white/80"
          >
            Target Song Collectors
          </label>
          <div className="relative">
            <Select
              value={selectedSongId}
              onValueChange={handleSongSelect}
            >
              <SelectTrigger className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white">
                <SelectValue placeholder="Select a song to target collectors" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white border-white/60">
                <SelectItem value="All">All Users</SelectItem>
                {songsAndCollectors.map((song) => (
                  <SelectItem
                    key={song.id}
                    value={String(song.id)}
                  >
                    {song.title} ({song.collectors?.length || 0} collectors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <MusicIcon className="absolute top-2.5 right-8 h-4 w-4 text-white/60" />
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block mb-1 text-sm text-white/80"
        >
          Notification Title
        </label>
        <div className="relative">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white"
          />
          <BellIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
        </div>
      </div>

      <div>
        <label
          htmlFor="body"
          className="block mb-1 text-sm text-white/80"
        >
          Notification Body
        </label>
        <textarea
          name="body"
          value={formData.body}
          onChange={handleChange}
          required
          className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white"
        />
      </div>

      <div>
        <label
          htmlFor="delay"
          className="block mb-1 text-sm text-white/80"
        >
          Delay (in seconds)
        </label>
        <div className="relative">
          <input
            type="number"
            name="delay"
            value={formData.delay}
            onChange={handleChange}
            required
            className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white"
          />
          <ClockIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
        </div>
      </div>

      <Button
        type="submit"
        variant="secondary"
        className={`w-full ${
          productionMode ? "bg-red-500 hover:bg-red-600" : ""
        }`}
      >
        {productionMode
          ? "Schedule PRODUCTION Notification"
          : "Schedule Test Notification"}
      </Button>
    </form>
  );
}
