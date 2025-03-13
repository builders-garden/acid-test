"use client";

import { useState, useEffect } from "react";
import { FileIcon, DollarSignIcon } from "lucide-react";
import { parseUnits } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { Button } from "@/components/ui/button";
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
    isRedacted: boolean;
    redactedUntil: number;
  }>({
    title: "",
    startDate: 0,
    endDate: 0,
    price: 0,
    audioFile: null,
    coverImage: null,
    isRedacted: false,
    redactedUntil: 0,
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
    if (isCreateConfirmed) {
      setModalStatus("success");
      setModalMessage("Transaction successful");
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

        // Validate redactedUntil is before startDate if both exist
        if (name === "redactedUntil" || name === "startDate") {
          if (formData.startDate && formData.redactedUntil) {
            if (formData.redactedUntil > formData.startDate) {
              setValidationError(
                "Redacted until date must be before start date"
              );
            } else {
              setValidationError(null);
            }
          }
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate redacted until date if song is redacted
    if (formData.isRedacted) {
      const now = Math.floor(Date.now() / 1000);

      if (formData.redactedUntil === 0) {
        setValidationError(
          "Please set a date when the song will be unredacted"
        );
        return;
      }

      if (formData.redactedUntil <= now) {
        setValidationError("Redacted until date must be in the future");
        return;
      }

      if (formData.redactedUntil >= formData.startDate) {
        setValidationError(
          "Redacted until date must be before the release date"
        );
        return;
      }
    }

    setModalOpen(true);
    setModalStatus("loading");
    setModalMessage("Uploading files to storage");

    // Validate required files
    if (!formData.audioFile || !formData.coverImage) {
      console.error("Audio file and cover image are required");
      setModalStatus("error");
      setModalMessage("Audio file and cover image are required");
      return;
    }

    let contractAddress;
    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS;
    } else {
      contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;
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

      // If the song is redacted, save it to the database
      if (formData.isRedacted) {
        try {
          const redactedData = {
            tokenId: uploadResult.metadataCID,
            title: formData.title,
            redactedUntil: formData.redactedUntil,
            startDate: formData.startDate,
          };

          // Save redacted song to database
          const dbResponse = await fetch("/api/redacted-songs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(redactedData),
          });

          if (!dbResponse.ok) {
            console.error("Failed to save redacted song to database");
          }
        } catch (error) {
          console.error("Error saving redacted song:", error);
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
          required
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

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox
            id="isRedacted"
            checked={formData.isRedacted}
            onCheckedChange={handleCheckboxChange}
          />
          <label
            htmlFor="isRedacted"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Redacted Release
          </label>
        </div>
        <p className="text-xs text-white/60">
          Hide song details until a specific date
        </p>
      </div>

      {formData.isRedacted && (
        <div>
          <label
            htmlFor="redactedUntil"
            className="block mb-1 text-sm text-white/80"
          >
            Redacted Until (Eastern Time)
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              name="redactedUntil"
              value={displayValues.redactedUntil}
              onChange={handleChange}
              required={formData.isRedacted}
              className="w-full p-2 border-2 border-white/60 bg-black text-white rounded-none focus:outline-none focus:border-white [color-scheme:dark]"
            />
          </div>
          {validationError && (
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
        disabled={!!validationError}
      >
        Confirm
      </Button>
    </form>
  );
}
