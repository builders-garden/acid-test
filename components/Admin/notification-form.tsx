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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(
    new Set()
  );
  const [selectAllSongs, setSelectAllSongs] = useState(false);
  const [nCollectors, setNCollectors] = useState<number>(0);
  const [customFids, setCustomFids] = useState<number[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    scheduledDate: "",
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

  const handleSongSelect = (songId: string, isChecked: boolean) => {
    const newSelectedSongs = new Set(selectedSongIds);
    if (isChecked) {
      newSelectedSongs.add(songId);
    } else {
      newSelectedSongs.delete(songId);
    }
    setSelectedSongIds(newSelectedSongs);

    // Calculate total unique collectors
    const uniqueCollectors = new Set<number>();
    songsAndCollectors
      .filter((song) => newSelectedSongs.has(String(song.id)))
      .forEach((song) => {
        song.collectors?.forEach((collector) =>
          uniqueCollectors.add(collector.user.fid)
        );
      });
    setNCollectors(uniqueCollectors.size);
    setCustomFids(Array.from(uniqueCollectors));
  };

  const handleSelectAllToggle = (checked: boolean) => {
    setSelectAllSongs(checked);
    if (checked) {
      const allSongIds = new Set(
        songsAndCollectors.map((song) => String(song.id))
      );
      setSelectedSongIds(allSongIds);

      // Calculate total unique collectors for all songs
      const uniqueCollectors = new Set<number>();
      songsAndCollectors.forEach((song) => {
        song.collectors?.forEach((collector) =>
          uniqueCollectors.add(collector.user.fid)
        );
      });
      setNCollectors(uniqueCollectors.size);
      setCustomFids(Array.from(uniqueCollectors));
    } else {
      setSelectedSongIds(new Set());
      setNCollectors(0);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
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

          const fid = parseInt(line.replace('"', ""));
          if (!isNaN(fid)) {
            fids.push(fid);
          } else {
            console.error("Invalid FID:", line);
          }
        }

        setCustomFids(fids);
      } catch (error) {
        setCsvError((error as Error).message);
        setCsvFile(null);
      }
    };

    reader.readAsText(file);
  };

  const calculateDelay = (scheduledDateStr: string): number => {
    if (!scheduledDateStr) return 0;

    const now = new Date();
    const scheduledDate = new Date(scheduledDateStr);

    const delayMs = scheduledDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(delayMs / 1000)); // Convert to seconds, minimum 0
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
        delay: calculateDelay(formData.scheduledDate),
      };

      if (mode === "test") {
        body.fids = [context.user.fid];
      } else {
        // Production mode
        if (prodTab === "announce") {
          // No fids needed - will send to all users
        } else {
          // Both "holders" and "custom" cases use customFids array
          body.fids = customFids;
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
        scheduledDate: "",
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
                    Select songs to send notifications to their collectors.
                    Duplicate collectors will receive only one notification.
                  </p>

                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      checked={selectAllSongs}
                      onCheckedChange={handleSelectAllToggle}
                      id="select-all"
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium"
                    >
                      Select All Songs
                    </label>
                  </div>

                  <div className="space-y-2">
                    {songsAndCollectors.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={selectedSongIds.has(String(song.id))}
                          onCheckedChange={(checked) =>
                            handleSongSelect(String(song.id), checked === true)
                          }
                          disabled={selectAllSongs}
                          id={`song-${song.id}`}
                        />
                        <label
                          htmlFor={`song-${song.id}`}
                          className="text-sm"
                        >
                          {song.title} ({song.collectors?.length || 0}{" "}
                          collectors)
                        </label>
                      </div>
                    ))}
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
          <Card className="border-white/60 bg-black text-white">
            <CardContent className="pt-4">
              <p className="text-sm text-white/70">
                In test mode, notifications will only be sent to you.
              </p>
            </CardContent>
          </Card>
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
            htmlFor="scheduledDate"
            className="block mb-1 text-sm text-white/80"
          >
            Schedule Date and Time
          </label>
          <input
            type="datetime-local"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().slice(0, 16)}
            className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white [color-scheme:dark]"
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          className={`w-full ${
            mode === "prod" ? "bg-red-500 hover:bg-red-600" : ""
          }`}
          disabled={
            mode === "prod" &&
            ((prodTab === "holders" && selectedSongIds.size === 0) ||
              (prodTab === "custom" && customFids.length === 0) ||
              !formData.scheduledDate ||
              calculateDelay(formData.scheduledDate) < 0)
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
