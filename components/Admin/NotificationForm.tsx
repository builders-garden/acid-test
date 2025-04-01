"use client";

import { useEffect, useState } from "react";
import {
  BellIcon,
  ClockIcon,
  MusicIcon,
  UploadIcon,
  UsersIcon,
  MegaphoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { DbSongWithCollectors } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

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
  const [selectedSongId, setSelectedSongId] = useState<string>("");
  const [nCollectors, setNCollectors] = useState<number>(0);
  const [customFids, setCustomFids] = useState<number[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    delay: 0,
  });

  const [mode, setMode] = useState<"test" | "prod">("test");
  const [prodTab, setProdTab] = useState<"announce" | "holders" | "custom">(
    "announce"
  );

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    // Parse CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        const fids: number[] = [];

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;

          const fid = parseInt(line);
          if (isNaN(fid)) {
            throw new Error(`Invalid FID: ${line}`);
          }
          fids.push(fid);
        }

        setCustomFids(fids);
      } catch (error) {
        setCsvError((error as Error).message);
        setCsvFile(null);
      }
    };

    reader.readAsText(file);
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
      let body: any = {
        title: formData.title,
        text: formData.body,
        delay: formData.delay,
      };

      if (mode === "test") {
        body.fids = [context.user.fid];
      } else {
        // Production mode
        switch (prodTab) {
          case "announce":
            // No specific targeting, send to everyone
            break;
          case "holders":
            body.songId = Number(selectedSongId);
            break;
          case "custom":
            body.fids = customFids;
            break;
        }
      }

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

      let successMessage = `Notification scheduled successfully in ${mode} mode`;

      if (mode === "prod") {
        switch (prodTab) {
          case "announce":
            successMessage += " to ALL users";
            break;
          case "holders":
            successMessage += ` to ${nCollectors} collectors`;
            break;
          case "custom":
            successMessage += ` to ${customFids.length} custom FIDs`;
            break;
        }
      }

      setModalStatus("success");
      setModalMessage(successMessage);

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
    <div className="w-full space-y-4">
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "test" | "prod")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">Test Mode</TabsTrigger>
          <TabsTrigger
            value="prod"
            className="text-red-500"
          >
            Production Mode
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-4"
      >
        {mode === "prod" && (
          <Tabs
            value={prodTab}
            onValueChange={(v) =>
              setProdTab(v as "announce" | "holders" | "custom")
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="announce">
                <MegaphoneIcon className="mr-2 h-4 w-4" />
                Announce
              </TabsTrigger>
              <TabsTrigger value="holders">
                <MusicIcon className="mr-2 h-4 w-4" />
                Song Holders
              </TabsTrigger>
              <TabsTrigger value="custom">
                <UsersIcon className="mr-2 h-4 w-4" />
                Custom FIDs
              </TabsTrigger>
            </TabsList>

            <Card className="mt-4 border-white/60 bg-black text-white">
              <CardContent className="pt-4">
                <TabsContent
                  value="announce"
                  className="mt-0"
                >
                  <p className="text-sm text-white/70">
                    This will send a notification to ALL users of the platform.
                  </p>
                </TabsContent>

                <TabsContent
                  value="holders"
                  className="mt-0 space-y-4"
                >
                  <p className="text-sm text-white/70">
                    This will send a notification to collectors of a specific
                    song.
                  </p>

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
                          {songsAndCollectors.map((song) => (
                            <SelectItem
                              key={song.id}
                              value={String(song.id)}
                            >
                              {song.title} ({song.collectors?.length || 0}{" "}
                              collectors)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <MusicIcon className="absolute top-2.5 right-8 h-4 w-4 text-white/60" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="custom"
                  className="mt-0 space-y-4"
                >
                  <p className="text-sm text-white/70">
                    Upload a CSV file with one FID per line to send a
                    notification to custom users.
                  </p>

                  <div>
                    <label
                      htmlFor="csvFile"
                      className="block mb-1 text-sm text-white/80"
                    >
                      Upload FIDs CSV
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="csvFile"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white"
                      />
                      <UploadIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
                    </div>
                    {csvError && (
                      <p className="mt-1 text-sm text-red-500">{csvError}</p>
                    )}
                    {csvFile && !csvError && (
                      <p className="mt-1 text-sm text-white/70">
                        Loaded {customFids.length} FIDs from {csvFile.name}
                      </p>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        )}

        {mode === "test" && (
          <div className="p-3 border-2 border-white/60 bg-black text-white">
            <p className="text-sm text-white/70">
              In test mode, notifications will only be sent to you.
            </p>
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
            mode === "prod" ? "bg-red-500 hover:bg-red-600" : ""
          }`}
          disabled={
            mode === "prod" &&
            ((prodTab === "holders" && !selectedSongId) ||
              (prodTab === "custom" && customFids.length === 0))
          }
        >
          {mode === "prod"
            ? `Schedule${
                prodTab === "holders"
                  ? ` to ${nCollectors} collectors`
                  : prodTab === "custom"
                  ? ` to ${customFids.length} FIDs`
                  : " to ALL USERS"
              }`
            : "Schedule Notification to yourself"}
        </Button>
      </form>
    </div>
  );
}
