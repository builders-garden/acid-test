"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  EclipseIcon as Ethereum,
  CircleDollarSign,
  Loader2,
} from "lucide-react";
import { useWriteContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { toast } from "sonner";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { useWaitForTransactionReceipt } from "wagmi";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { sendDelayedNotification } from "@/lib/qstash";

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  mintQuantity: number;
  songName: string;
  setMintQuantity: (quantity: number) => void;
  paymentMethod: "ETH" | "USDC";
  setPaymentMethod: (method: "ETH" | "USDC") => void;
  userAddress: `0x${string}` | undefined;
  tokenId: number;
  usdPrice: number;
  ethUsd: number;
}

const { type: contextType, context } = useMiniAppContext();



enum MintState {
  Initial = 0,
  Confirm = 1,
  Success = 2,
}

export function MintModal({
  isOpen,
  onClose,
  mintQuantity,
  setMintQuantity,
  songName,
  paymentMethod,
  setPaymentMethod,
  userAddress,
  tokenId,
  usdPrice,
  ethUsd,
}: MintModalProps) {
  const [isSliderInteracting, setIsSliderInteracting] = useState(false);
  const [mintState, setMintState] = useState<MintState>(MintState.Initial);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const price = usdPrice / ethUsd;
  const safePrice = price + price * 0.01;

  const {
    data: mintTxHash,
    isPending: isMintPending,
    error: mintError,
    writeContract: writeContractMint,
    status: mintStatus,
    reset: resetMint,
  } = useWriteContract();

  const txResult = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  const handleMint = async (amount: number, isWETH: boolean) => {
    try {
      if (userAddress) {
        writeContractMint({
          address: CONTRACT_ADDRESS,
          abi: AcidTestABI,
          functionName: "mint",
          args: [userAddress, BigInt(tokenId), BigInt(amount), isWETH],
          value: BigInt(Math.ceil(safePrice * amount * 10 ** 18)),
        });
      }
    } catch (error: unknown) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (mintError) {
      console.log(mintError);
      if (!mintError.message.includes("The user rejected the request")) {
        toast(mintError.message);
      }
    }
  }, [mintError]);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    setIsSliderInteracting(true);
  }, []);

  const handleSliderPointerUp = useCallback(() => {
    setIsSliderInteracting(false);
  }, []);

  useEffect(() => {
    const handlePointerUp = () => {
      setIsSliderInteracting(false);
    };

    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleDragStart = (event: React.PointerEvent) => {
    if (!isSliderInteracting) {
      dragControls.start(event);
    }
  };

  const handleClose = () => {
    setMintState(MintState.Initial);
    resetMint();
    onClose();
  };

  useEffect(() => {
    switch (mintStatus) {
      case "pending":
        setMintState(MintState.Confirm);
        break;
      case "error":
        setMintState(MintState.Initial);
        break;
    }
  }, [mintStatus]);

  useEffect(() => {
    if (txResult && txResult.status === "success") {
      setMintState(MintState.Success);

      const sendNotification = async () => {
        if (contextType === "farcaster" && context?.user?.fid) {
          try {
            await sendDelayedNotification(
              context?.user?.fid, 
              `You just collected ${mintQuantity} ${mintQuantity > 1 ? "editions" : "edition"} of ${songName}!`, 
              "You currently hold the 15th spot on the collectors leaderboard. Thank you",
              0
            )
          } catch (error) {
            console.error("Error sending notification:", error);
            toast("Error sending notification");
          }
        }
      };
      
      const createCollection = async () => {
        let fid;
        if (contextType === "farcaster") {
          if (context && context.user.fid) {
            fid = context.user.fid;
          }
        }
        try {
          const response = await fetch('/api/dbops', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: fid, // Assuming `context.user.id` contains the user ID
              songId: tokenId, // Assuming `tokenCounter` is the ID of the song
            }),
          });
    
         
          if (!response.ok) {
            const errorData = await response.json(); // Parse error response
            throw new Error(errorData.error || 'Failed to create collection');
          }
    
         
          const result = await response.json();
          console.log('Created collection: ', result.data);
        } catch (error: unknown) {
          console.error('Error creating collection: ', error instanceof Error ? error.message : error);
          toast('Error creating collection');
        }
      };

      sendNotification();
      createCollection();
  
    } else if (txResult && txResult.status === "error") {
      toast("Minting failed");
      setMintState(MintState.Initial);
    }
  }, [txResult, mintQuantity]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            ref={modalRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            drag={isSliderInteracting ? false : "y"}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) handleClose();
            }}
            className="fixed inset-x-4 bottom-4 z-50 bg-black border-2 border-white/20 rounded-2xl shadow-lg shadow-black/50"
            onPointerDown={handleDragStart}
          >
            <div className="flex justify-center p-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="h-[400px] flex items-center justify-center">
              {mintState === MintState.Initial && (
                <div className="p-8 space-y-8 max-w-sm w-full">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">
                        # of editions
                      </span>
                      <span className="text-sm">{mintQuantity}</span>
                    </div>
                    <Slider
                      min={1}
                      max={500}
                      step={1}
                      value={[mintQuantity]}
                      onValueChange={(value) => setMintQuantity(value[0])}
                      className="w-full"
                      onPointerDown={handleSliderPointerDown}
                      onPointerUp={handleSliderPointerUp}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-white/60">checkout with</span>
                    <div className="flex justify-center items-center gap-4">
                      <Button
                        variant="outline"
                        className={`flex-1 flex items-center justify-center gap-2 py-6 bg-black hover:bg-black/90 ${
                          paymentMethod === "ETH"
                            ? "border-2 border-white text-white"
                            : "border border-white/20 text-white/60 hover:text-white"
                        }`}
                        onClick={() => setPaymentMethod("ETH")}
                      >
                        <Ethereum className="w-5 h-5" />
                        ETH
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 flex items-center justify-center gap-2 py-6 bg-black hover:bg-black/90 ${
                          paymentMethod === "USDC"
                            ? "border-2 border-white text-white"
                            : "border border-white/20 text-white/60 hover:text-white"
                        }`}
                        onClick={() => setPaymentMethod("USDC")}
                      >
                        <CircleDollarSign className="w-5 h-5" />
                        USDC
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full py-6 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
                    onClick={() => handleMint(mintQuantity, false)}
                  >
                    MINT
                  </Button>

                  <div className="flex justify-between items-start text-sm">
                    <span className="text-white/60">Total Cost</span>
                    <div className="text-right">
                      <div>
                        {paymentMethod === "ETH"
                          ? `${(safePrice * mintQuantity).toFixed(6)} ETH`
                          : `${mintQuantity} USDC`}
                      </div>
                      <div className="text-white/60 text-xs">
                        {paymentMethod === "ETH"
                          ? `$${(safePrice * mintQuantity * ethUsd).toFixed(
                              2
                            )} USD`
                          : `${(mintQuantity / ethUsd).toFixed(6)} ETH`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mintState === MintState.Confirm && (
                <div className="p-8 max-w-sm w-full relative overflow-hidden">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-lg font-bold">Minting on Base</span>
                    </div>
                    <div className="text-center text-lg">
                      Confirm in wallet...
                    </div>
                  </div>
                  <div className="absolute inset-0 -z-10">
                    <motion.div
                      className="w-full h-full"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        duration: 10,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                    >
                      <div className="w-64 h-64 border-4 border-white/10 rounded-full blur-md" />
                    </motion.div>
                  </div>
                </div>
              )}

              {mintState === MintState.Success && (
                <div className="p-8 max-w-sm w-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 bg-black border-2 border-white/20 rounded-full relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3/4 h-3/4 rounded-full border-2 border-white/40 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white/40" />
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-lg">
                      You minted {mintQuantity} edition
                      {mintQuantity > 1 ? "s" : ""} of AT001!
                    </p>
                    {mintTxHash && (
                      <a
                        href={`https://sepolia.basescan.org/tx/${mintTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline text-sm flex items-center gap-1"
                      >
                        View on Basescan
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="inline"
                        >
                          <path
                            d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 3H21V9"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 14L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      className="w-full py-6 text-lg border-2 bg-white text-black hover:bg-white/90 hover:text-black"
                      onClick={handleClose}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
