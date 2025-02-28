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
      const date = Math.floor(new Date(value).getTime() / 1000);
      setFormData((prev) => ({ ...prev, [name]: date }));
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

  const handleMockUpload = async () => {
    // Create a mocked metadata object
    const mockedMetadata = {
      name: "Mocked Title",
      image: "ipfs://mocked-cover-image-uri",
      animation_url: "ipfs://mocked-audio-file-uri",
      description: "Mocked description for testing",
    };

    // Create a file from the mocked metadata JSON
    const file = new File(
      [JSON.stringify(mockedMetadata)],
      "mocked_metadata.json",
      { type: "application/json" }
    );

    const data = new FormData();
    data.set("file", file);

    // Upload the mocked file
    const uploadRequest = await fetch("api/pinata", {
      method: "POST",
      body: data,
    });

    console.log("Upload request: ", uploadRequest);
    const uploadResponse = await uploadRequest.json();
    console.log("Upload response: ", uploadResponse);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      <div className="w-full flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Link
          href="/"
          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          Home
        </Link>
      </div>

      {selectedAction && (
        <div className="absolute top-16 left-6">
          <h2 className="text-lg font-semibold">{selectedAction}</h2>
        </div>
      )}

      {showForm && (
        <button
          onClick={() => {
            setShowForm(false);
            setSelectedAction(null);
          }}
          className="absolute top-6 right-6 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          Go Back
        </button>
      )}

      {!showForm && (
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => {
              setShowForm(true);
              setSelectedAction("Create Song Sale");
            }}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create Song Sale
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setSelectedAction("Update Song Sale");
            }}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            Update Song Sale
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-4 mt-8"
        >
          <div>
            <label
              htmlFor="title"
              className="block mb-1"
            >
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border border-white/60 bg-black text-white rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="startDate"
              className="block mb-1"
            >
              Start Date <CalendarIcon />
            </label>
            <input
              type="datetime-local"
              name="startDate"
              value={displayValues.startDate}
              onChange={handleChange}
              required
              className="w-full p-2 border border-white/60 bg-black text-white rounded-lg [color-scheme:dark]"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block mb-1"
            >
              End Date <CalendarIcon />
            </label>
            <input
              type="datetime-local"
              name="endDate"
              value={displayValues.endDate}
              onChange={handleChange}
              required
              className="w-full p-2 border border-white/60 bg-black text-white rounded-lg [color-scheme:dark]"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block mb-1"
            >
              Price <DollarSignIcon />
            </label>
            <input
              type="number"
              name="price"
              value={displayValues.price}
              onChange={handleChange}
              min="0"
              step="0.000001"
              required
              className="w-full p-2 border border-white/60 bg-black text-white rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="audioFile"
              className="block mb-1"
            >
              Audio File <FileIcon />
            </label>
            <input
              type="file"
              name="audioFile"
              onChange={handleFileChange}
              accept="audio/*"
              required
              className="w-full p-2 border border-white/60 bg-black text-white rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="coverImage"
              className="block mb-1"
            >
              Cover Image <FileIcon />
            </label>
            <input
              type="file"
              name="coverImage"
              onChange={handleFileChange}
              accept="image/*"
              required
              className="w-full p-2 border border-white/60 bg-black text-white rounded-lg"
            />
            {imagePreview && (
              <div className="mt-2 flex justify-center">
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  className="max-w-[200px] max-h-[200px] object-contain"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Confirm
          </button>
        </form>
      )}

      {/* New button for mocked upload */}
      <button
        onClick={handleMockUpload}
        className="mt-4 p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
      >
        Upload Mocked JSON
      </button>

      <TransactionModal
        isOpen={modalOpen}
        status={modalStatus}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
