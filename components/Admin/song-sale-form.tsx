"use client";

import { useState, useEffect } from "react";
import { FileIcon, DollarSignIcon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { Button } from "@/components/ui/button";
import { useReadContract } from "wagmi";
import { Checkbox } from "@/components/ui/checkbox";
import { upload } from "@vercel/blob/client";

interface SongSaleFormProps {
  setModalOpen: (open: boolean) => void;
  setModalStatus: (status: "loading" | "success" | "error") => void;
  setModalMessage: (message: string) => void;
}

export default function SongSaleForm({
  setModalOpen,
  setModalStatus,
  setModalMessage,
}: SongSaleFormProps) {
  const [tokenCounter, setTokenCounter] = useState<number | undefined>(
    undefined
  );
  let contractAddress;
  if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
    contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS;
  } else {
    contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;
  }

  const getIdCounter = useReadContract({
    abi: AcidTestABI,
    address: contractAddress as `0x${string}`,
    functionName: "idCounter",
    args: [],
    query: {
      enabled: tokenCounter === undefined,
    },
  });

  useEffect(() => {
    if (getIdCounter.data) {
      setTokenCounter(Number(getIdCounter.data));
    }
  }, [getIdCounter.data]);

  const {
    data: createTxHash,
    isPending: isCreatePending,
    error: createError,
    writeContract: writeContract_create,
  } = useWriteContract();

  const { isLoading: isCreateConfirming, isSuccess: isCreateConfirmed } =
    useWaitForTransactionReceipt({ hash: createTxHash });

  const [formData, setFormData] = useState<{
    title: string;
    startDate: number;
    endDate: number;
    price: number;
    audioFile: File | null;
    coverImage: File | null;
    isNewRedactedSong: boolean;
    isUnveilingSong: boolean;
  }>({
    title: "",
    startDate: 0,
    endDate: 0,
    price: 0,
    audioFile: null,
    coverImage: null,
    isNewRedactedSong: false,
    isUnveilingSong: false,
  });

  const [displayValues, setDisplayValues] = useState({
    price: "",
    startDate: "",
    endDate: "",
    redactedUntil: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isCreateConfirmed && tokenCounter) {
      setModalStatus("success");
      setModalMessage("Transaction successful");
      const setNotifications = async () => {
        try {
          const songResponse = await fetch("/api/song", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tokenId: tokenCounter + 1,
              title: formData.title,
              startDate: formData.startDate.toString(),
              endDate: formData.endDate.toString(),
            }),
          });

          // Check if the request was successful
          if (!songResponse.ok) {
            const errorData = await songResponse.json(); // Parse error response
            throw new Error(errorData.error || "Failed to upload song");
          }

          const setupNotisResponse = await fetch("/api/setup-notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: formData.title,
              startDate: formData.startDate.toString(),
              endDate: formData.endDate.toString(),
              price: formatUnits(BigInt(formData.price), 6),
              tokenId: (tokenCounter + 1).toString(),
            }),
          });

          if (!setupNotisResponse.ok) {
            const errorData = await setupNotisResponse.json();
            console.error("Failed to setup notifications:", errorData);
          }
        } catch (error) {
          console.error("Error calling notification API:", error);
        }
      };
      setNotifications();
    }
    if (createError) {
      setModalStatus("error");
      setModalMessage("Error: " + createError.message);
    }
    if (isCreatePending) {
      setModalStatus("loading");
      setModalMessage("Pending transaction");
    }
    if (createTxHash) {
      console.log("Transaction hash: ", createTxHash);
    }
  }, [
    isCreateConfirmed,
    createError,
    isCreatePending,
    createTxHash,
    setModalStatus,
    setModalMessage,
  ]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (
      name === "startDate" ||
      name === "endDate" ||
      name === "redactedUntil"
    ) {
      setDisplayValues((prev) => ({ ...prev, [name]: value }));

      // Convert Eastern Time to UTC
      if (value) {
        const [datePart, timePart] = value.split("T");
        const easternDate = new Date(
          `${datePart}T${timePart || "00:00:00"}-05:00`
        );
        const utcDate = new Date(easternDate.toISOString());
        const timestamp = Math.floor(utcDate.getTime() / 1000);
        setFormData((prev) => ({ ...prev, [name]: timestamp }));
      }
    } else if (name === "price") {
      // Prevent negative values
      const numValue = parseFloat(value);
      if (numValue < 0) return;

      setDisplayValues((prev) => ({ ...prev, price: value }));
      try {
        const priceInUSDC = parseUnits(value, 6);
        setFormData((prev) => ({ ...prev, price: Number(priceInUSDC) }));
      } catch (error) {
        console.error("Invalid price format");
        setFormData((prev) => ({ ...prev, price: 0 }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isRedacted: checked }));

    // Reset redactedUntil if isRedacted is unchecked
    if (!checked) {
      setFormData((prev) => ({ ...prev, redactedUntil: 0 }));
      setDisplayValues((prev) => ({ ...prev, redactedUntil: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));

      // Create preview URL for cover image
      if (name === "coverImage") {
        const url = URL.createObjectURL(files[0]);
        setImagePreview(url);
      }
    }
  };

  const handleRedactedCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));

    // If creating a new redacted song, disable unveiling option
    if (name === "isNewRedactedSong" && checked) {
      setFormData((prev) => ({ ...prev, isUnveilingSong: false }));
    }

    // If unveiling a song, disable creating a new redacted option
    if (name === "isUnveilingSong" && checked) {
      setFormData((prev) => ({ ...prev, isNewRedactedSong: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setModalOpen(true);
    setModalStatus("loading");

    // Handle creating a new redacted song placeholder
    if (formData.isNewRedactedSong) {
      try {
        const response = await fetch("/api/redacted-songs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setModalStatus("error");
          setModalMessage(
            errorData.error || "Failed to create redacted song placeholder"
          );
          return;
        }

        setModalStatus("success");
        setModalMessage("Redacted song placeholder created successfully!");
        return;
      } catch (error) {
        console.error("Error creating redacted song placeholder:", error);
        setModalStatus("error");
        setModalMessage(`Error: ${error}`);
        return;
      }
    }

    // Continue with the normal song upload process
    setModalMessage("Uploading files to storage");

    // Validate required files
    if (!formData.audioFile || !formData.coverImage) {
      console.error("Audio file and cover image are required");
      setModalStatus("error");
      setModalMessage("Audio file and cover image are required");
      return;
    }

    try {
      // Upload audio file to Vercel Blob
      setModalMessage("Uploading audio file...");
      const audioBlob = await upload(
        `audio-${Date.now()}-${formData.audioFile.name}`,
        formData.audioFile,
        {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        }
      );

      // Upload cover image to Vercel Blob
      setModalMessage("Uploading cover image...");
      const imageBlob = await upload(
        `image-${Date.now()}-${formData.coverImage.name}`,
        formData.coverImage,
        {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        }
      );

      setModalMessage("Files uploaded. Pinning to IPFS...");

      // Send the Blob URLs to Pinata API
      const uploadResponse = await fetch("/api/pinata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "combined",
          audioFileUrl: audioBlob.url,
          imageFileUrl: imageBlob.url,
          title: formData.title,
          description: "Acid test hit",
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        setModalStatus("error");
        setModalMessage(errorData.error || "Error during upload process");
        return;
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload result:", JSON.stringify(uploadResult, null, 2));
      console.log("Metadata URL:", uploadResult.metadataUrl);
      setModalStatus("success");
      setModalMessage("Upload successful!");

      // If unveiling a song, call the unveil API
      if (formData.isUnveilingSong) {
        try {
          const unveilResponse = await fetch("/api/redacted-songs/unveil", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!unveilResponse.ok) {
            console.warn(
              "Failed to unveil redacted song, but continuing with upload"
            );
          } else {
            console.log("Successfully unveiled a redacted song");
          }
        } catch (error) {
          console.warn(
            "Error unveiling redacted song, but continuing with upload:",
            error
          );
        }
      }

      // Wait for 2 seconds before writing to the contract
      setTimeout(async () => {
        setModalOpen(true);
        setModalStatus("loading");
        setModalMessage("Pending transaction");

        writeContract_create({
          address: contractAddress as `0x${string}`,
          abi: AcidTestABI,
          functionName: "create",
          args: [
            formData.startDate,
            formData.endDate,
            BigInt(formData.price),
            uploadResult.metadataUrl,
          ],
        });
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setModalStatus("error");
      setModalMessage(`Error during upload process: ${error}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-4"
    >
      {/* Section for redacted songs at the top */}
      <div className="border-2 border-white/20 p-4 mb-4 rounded-lg">
        <h3 className="text-lg font-bold mb-3">Song Redaction</h3>

        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="isNewRedactedSong"
            checked={formData.isNewRedactedSong}
            onCheckedChange={(checked) =>
              handleRedactedCheckboxChange(
                "isNewRedactedSong",
                checked === true
              )
            }
          />
          <label
            htmlFor="isNewRedactedSong"
            className="text-sm font-medium leading-none"
          >
            Create a new redacted song placeholder
          </label>
        </div>
        <p className="text-xs text-white/60 mb-4">
          Creates a placeholder for a future song release
        </p>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isUnveilingSong"
            checked={formData.isUnveilingSong}
            onCheckedChange={(checked) =>
              handleRedactedCheckboxChange("isUnveilingSong", checked === true)
            }
          />
          <label
            htmlFor="isUnveilingSong"
            className="text-sm font-medium leading-none"
          >
            Unveil a redacted song
          </label>
        </div>
        <p className="text-xs text-white/60">
          This song will replace the oldest redacted placeholder
        </p>
      </div>

      {/* Hide the song details form if only creating a redacted placeholder */}
      {!formData.isNewRedactedSong && (
        <>
          <div>
            <label
              htmlFor="title"
              className="block mb-1 text-sm text-white/80"
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required={!formData.isNewRedactedSong}
              className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block mb-1 text-sm text-white/80"
            >
              Start Date (Eastern Time)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                name="startDate"
                value={displayValues.startDate}
                onChange={handleChange}
                required
                className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block mb-1 text-sm text-white/80"
            >
              End Date (Eastern Time)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                name="endDate"
                value={displayValues.endDate}
                onChange={handleChange}
                required
                className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="price"
              className="block mb-1 text-sm text-white/80"
            >
              Price
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                value={displayValues.price}
                onChange={handleChange}
                min="0"
                step="0.000001"
                required
                className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white"
              />
              <DollarSignIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
            </div>
          </div>

          <div>
            <label
              htmlFor="audioFile"
              className="block mb-1 text-sm text-white/80"
            >
              Audio File
            </label>
            <div className="relative">
              <input
                type="file"
                name="audioFile"
                onChange={handleFileChange}
                accept=".wav,.aif,.aiff,.flac,.alac,.aac,.ogg,.mp3"
                required
                className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none file:mr-4 file:py-1 file:px-2 file:rounded-none file:border-0 file:bg-white/10 file:text-white"
              />
              <FileIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
            </div>
          </div>

          <div>
            <label
              htmlFor="coverImage"
              className="block mb-1 text-sm text-white/80"
            >
              Cover Image
            </label>
            <div className="relative">
              <input
                type="file"
                name="coverImage"
                onChange={handleFileChange}
                accept="image/*"
                required
                className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none file:mr-4 file:py-1 file:px-2 file:rounded-none file:border-0 file:bg-white/10 file:text-white"
              />
              <FileIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
            </div>
            {imagePreview && (
              <div className="mt-2 flex justify-center border-2 border-white/20 p-2">
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </div>
            )}
          </div>
        </>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
        disabled={!!validationError}
      >
        {formData.isNewRedactedSong ? "Create Redacted Placeholder" : "Confirm"}
      </Button>
    </form>
  );
}
