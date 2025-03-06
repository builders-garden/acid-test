"use client";

import { useState, useEffect } from "react";
import { FileIcon, CalendarIcon, DollarSignIcon } from "lucide-react";
import { parseEther, parseUnits } from "viem";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useAccount,
} from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { PinataSDK } from "pinata-web3";
import { env } from "@/lib/env";
import TransactionModal from "../transaction-modal";
import Link from "next/link";
import { Header } from "../header";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
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
  }>({
    title: "",
    startDate: 0,
    endDate: 0,
    price: 0,
    audioFile: null,
    coverImage: null,
  });

  const [displayValues, setDisplayValues] = useState({
    price: "",
    startDate: "",
    endDate: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [modalMessage, setModalMessage] = useState("");

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
  }, [isCreateConfirmed, createError, isCreatePending, createTxHash]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "startDate" || name === "endDate") {
      setDisplayValues((prev) => ({ ...prev, [name]: value }));

      // Convert Eastern Time to UTC
      if (value) {
        // Parse the input value
        const [datePart, timePart] = value.split("T");

        // Create a date object representing this time in Eastern Time
        const easternDate = new Date(
          `${datePart}T${timePart || "00:00:00"}-05:00`
        );

        // Get the equivalent UTC time
        const utcDate = new Date(easternDate.toISOString());

        // Calculate timestamp for the contract
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

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalOpen(true);
    setModalStatus("loading");
    setModalMessage("Uploading files to IPFS");

    console.log("form data: ", formData);

    // Validate required files
    if (!formData.audioFile || !formData.coverImage) {
      console.error("Audio file and cover image are required");
      return;
    }

    let contractAddress;
    if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
      contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_TEST_ADDRESS;
    } else {
      contractAddress = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;
    }

    try {
      // Create form data for server-side upload
      const uploadFormData = new FormData();
      uploadFormData.set("type", "combined");
      uploadFormData.set("audioFile", formData.audioFile);
      uploadFormData.set("imageFile", formData.coverImage);
      uploadFormData.set("title", formData.title);
      uploadFormData.set("description", "Acid test hit");

      // Send combined upload request to the server
      const uploadResponse = await fetch("/api/pinata", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        setModalStatus("error");
        setModalMessage(errorData.error || "Error during upload process");
        return;
      }

      const uploadResult = await uploadResponse.json();
      setModalStatus("success");
      setModalMessage("Upload successful!");

      // Wait for 2 seconds before writing to the contract
      setTimeout(async () => {
        setModalOpen(true);
        setModalStatus("loading");
        setModalMessage("Pending transaction");

        // Call the smart contract with the metadata URL
        console.log({
          contractAddress,
          startDate: formData.startDate,
          endDate: formData.endDate,
          price: BigInt(formData.price),
          metadataUrl: uploadResult.metadataUrl,
        });

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
      }, 2000); // 2000 milliseconds = 2 seconds
    } catch (error) {
      setModalStatus("error");
      setModalMessage("Error during upload process");
    }
  };

  // Commented out for now
  // const handleMockUpload = async () => {
  //   // Create a mocked metadata object
  //   const mockedMetadata = {
  //     name: "Mocked Title",
  //     image: "ipfs://mocked-cover-image-uri",
  //     animation_url: "ipfs://mocked-audio-file-uri",
  //     description: "Mocked description for testing",
  //   };

  //   // Create a file from the mocked metadata JSON
  //   const file = new File(
  //     [JSON.stringify(mockedMetadata)],
  //     "mocked_metadata.json",
  //     { type: "application/json" }
  //   );

  //   const data = new FormData();
  //   data.set("file", file);

  //   // Upload the mocked file
  //   const uploadRequest = await fetch("api/pinata", {
  //     method: "POST",
  //     body: data,
  //   });

  //   console.log("Upload request: ", uploadRequest);
  //   const uploadResponse = await uploadRequest.json();
  //   console.log("Upload response: ", uploadResponse);
  // };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      <Header />

      <div className="w-full max-w-md space-y-6 mt-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <Link href="/">
            <Button
              variant="outline"
              className="border-2 border-white/60 bg-transparent text-white hover:bg-white/20 transition-colors"
            >
              Back to Home
            </Button>
          </Link>
        </div>

        {selectedAction && (
          <div className="w-full">
            <h2 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              {selectedAction}
            </h2>
          </div>
        )}

        {showForm && (
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setSelectedAction(null);
            }}
            className="w-full border-2 border-white/60 bg-transparent text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </Button>
        )}

        {!showForm && (
          <div className="flex flex-col space-y-4 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(true);
                setSelectedAction("Create Song Sale");
              }}
              className="w-full h-12 border-2 bg-white text-black hover:bg-white/90 hover:text-black transition-colors"
            >
              Create Song Sale
            </Button>
            {/* Commented out for now
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(true);
                setSelectedAction("Update Song Sale");
              }}
              className="w-full h-12 border-2 border-white/60 bg-transparent text-white hover:bg-white/20 transition-colors"
            >
              Update Song Sale
            </Button>
            */}
          </div>
        )}

        {showForm && (
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
                <CalendarIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
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
                <CalendarIcon className="absolute top-2.5 right-2.5 h-4 w-4 text-white/60" />
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

            <Button
              type="submit"
              className="w-full h-12 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
            >
              Confirm
            </Button>
          </form>
        )}

        {/* Hidden in production - Development helper */}
        {/* Commented out for now
        {process.env.NODE_ENV === "development" && (
          <Button
            onClick={handleMockUpload}
            className="mt-4 w-full border-2 border-white/60 bg-transparent text-white hover:bg-white/20 transition-colors opacity-50"
          >
            Upload Mocked JSON (Dev Only)
          </Button>
        )}
        */}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        status={modalStatus}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
