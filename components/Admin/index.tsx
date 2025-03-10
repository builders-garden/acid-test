"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "../header";
import { Button } from "@/components/ui/button";
import SongSaleForm from "./SongSaleForm";
import TransactionModal from "../transaction-modal";
import NotificationForm from "./NotificationForm";

type AdminAction = "Create Song Sale" | "Send Notification" | null;

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdminAction>(null);

  // Transaction modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [modalMessage, setModalMessage] = useState("");

  const handleBack = () => {
    setShowForm(false);
    setSelectedAction(null);
  };

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
            onClick={handleBack}
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

            <Button
              variant="outline"
              onClick={() => {
                setShowForm(true);
                setSelectedAction("Send Notification");
              }}
              className="w-full h-12 border-2 border-white/60 bg-transparent text-white hover:bg-white/20 transition-colors"
            >
              Send Notification
            </Button>
          </div>
        )}

        {showForm && selectedAction === "Create Song Sale" && (
          <SongSaleForm
            setModalOpen={setModalOpen}
            setModalStatus={setModalStatus}
            setModalMessage={setModalMessage}
          />
        )}

        {showForm && selectedAction === "Send Notification" && (
          <NotificationForm
            setModalOpen={setModalOpen}
            setModalStatus={setModalStatus}
            setModalMessage={setModalMessage}
          />
        )}
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
