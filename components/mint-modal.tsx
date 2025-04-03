"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useBalance, useReadContract, useWriteContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { toast } from "sonner";
import { CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS } from "@/lib/constants";
import { useWaitForTransactionReceipt } from "wagmi";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { erc20Abi } from "viem";
import { formatSongId } from "@/lib/utils";
import { handleAddFrame } from "./header";

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
  refetch: () => void;
  image?: string;
}

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
  refetch,
  image,
}: MintModalProps) {
  const [isSliderInteracting, setIsSliderInteracting] = useState(false);
  const [mintState, setMintState] = useState<MintState>(MintState.Initial);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const price = usdPrice / ethUsd;
  const safePrice = price + price * 0.01;

  const { type: contextType, context } = useMiniAppContext();

  const { data: balanceData } = useBalance({ address: userAddress });

  const { data: usdcBalance } = useReadContract({
    abi: erc20Abi,
    address: USDC_CONTRACT_ADDRESS,
    functionName: "balanceOf",
    args: [userAddress!],
    query: {
      enabled: userAddress !== undefined,
    },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: USDC_CONTRACT_ADDRESS,
    functionName: "allowance",
    args: [userAddress!, CONTRACT_ADDRESS],
    query: {
      enabled: userAddress !== undefined,
    },
  });

  const {
    data: allowanceTxHash,
    error: allowanceError,
    writeContract: writeContractAllowance,
    status: allowanceStatus,
    reset: resetAllowance,
  } = useWriteContract();

  const allowanceTxResult = useWaitForTransactionReceipt({
    hash: allowanceTxHash,
  });

  useEffect(() => {
    if (allowanceTxResult.isSuccess) {
      refetchAllowance();
    }
  }, [allowanceTxResult.isSuccess, refetchAllowance]);

  const handleApprove = async () => {
    try {
      if (userAddress) {
        writeContractAllowance({
          address: USDC_CONTRACT_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, BigInt(usdPrice * mintQuantity * 10 ** 6)],
        });
      }
    } catch (error: unknown) {
      console.error(error);
    }
  };

  const {
    data: mintTxHash,
    error: mintError,
    writeContract: writeContractMint,
    status: mintStatus,
    reset: resetMint,
  } = useWriteContract();

  const mintTxResult = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  useEffect(() => {
    refetchAllowance();
  }, [isOpen, refetchAllowance]);

  const handleMint = async (amount: number, isWETH: boolean) => {
    try {
      if (userAddress) {
        writeContractMint({
          address: CONTRACT_ADDRESS,
          abi: AcidTestABI,
          functionName: "mint",
          args: [userAddress, BigInt(tokenId), BigInt(amount), isWETH],
          value:
            paymentMethod === "ETH"
              ? BigInt(Math.ceil(safePrice * amount * 10 ** 18))
              : BigInt(0),
        });
      }
    } catch (error: unknown) {
      console.error(error);
    }
  };

  const hasEnoughEthBalance = () => {
    if (!balanceData || !userAddress) return false;
    const requiredEth = BigInt(Math.ceil(safePrice * mintQuantity * 10 ** 18));
    return BigInt(balanceData.value) >= requiredEth;
  };

  const hasEnoughUsdcBalance = () => {
    if (!usdcBalance || !userAddress) return false;
    const requiredUsdc = BigInt(Math.ceil(usdPrice * mintQuantity * 10 ** 6));
    return BigInt(usdcBalance) >= requiredUsdc;
  };

  const hasEnoughUsdcAllowance = () => {
    if (!usdcAllowance || !userAddress) return false;
    const requiredAllowance = BigInt(
      Math.ceil(usdPrice * mintQuantity * 10 ** 6)
    );
    return BigInt(usdcAllowance) >= requiredAllowance;
  };

  useEffect(() => {
    if (mintError) {
      console.error(mintError);
      if (!mintError.message.includes("The user rejected the request")) {
        toast(mintError.message);
      }
    }
  }, [mintError]);

  useEffect(() => {
    if (allowanceError) {
      console.error(allowanceError);
      if (!allowanceError.message.includes("The user rejected the request")) {
        toast(allowanceError.message);
      }
    }
  }, [allowanceError]);

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
    handleAddFrame();
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
    if (
      mintTxResult &&
      mintTxResult.status === "success" &&
      mintState !== MintState.Success
    ) {
      setMintState(MintState.Success);

      const sendNotification = async () => {
        if (contextType === "farcaster" && context?.user?.fid) {
          try {
            const body = {
              title: `You just collected ${mintQuantity} ${
                mintQuantity > 1 ? "editions" : "edition"
              } of ${songName}!`,
              text: "You currently hold the 15th spot on the collectors leaderboard. Thank you", // TODO: Add custom message
              delay: 0,
              fid: context.user.fid,
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
          const response = await fetch("/api/collection", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: fid, // Assuming `context.user.id` contains the user ID
              songId: tokenId, // Assuming `tokenCounter` is the ID of the song
              amount: mintQuantity,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json(); // Parse error response
            throw new Error(errorData.error || "Failed to create collection");
          }

          refetch();
        } catch (error: unknown) {
          console.error(
            "Error creating collection: ",
            error instanceof Error ? error.message : error
          );
          toast("Error creating collection");
        }
      };

      sendNotification();
      createCollection();
    } else if (
      mintTxResult &&
      mintTxResult.status === "error" &&
      mintState !== MintState.Initial
    ) {
      toast("Minting failed");
      setMintState(MintState.Initial);
    }
  }, [mintTxResult, mintQuantity, mintState, songName, tokenId]);

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
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-sm"># of editions</span>
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
                    <span className="text-sm text-white">checkout with</span>
                    <div className="flex justify-center items-center gap-4">
                      <Button
                        variant="outline"
                        className={`flex-1 flex items-center justify-center gap-2 py-6 bg-black hover:bg-black/90 ${
                          paymentMethod === "ETH"
                            ? "border-2 border-white text-white hover:text-white"
                            : "border border-white/20 text-white/60 hover:text-white"
                        }`}
                        onClick={() => setPaymentMethod("ETH")}
                      >
                        {/* <Ethereum className="w-5 h-5" /> */}
                        ETH
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 flex items-center justify-center gap-2 py-6 bg-black hover:bg-black/90 ${
                          paymentMethod === "USDC"
                            ? "border-2 border-white text-white hover:text-white"
                            : "border border-white/20 text-white/60 hover:text-white"
                        }`}
                        onClick={() => setPaymentMethod("USDC")}
                      >
                        {/*  <CircleDollarSign className="w-5 h-5" /> */}
                        USDC
                      </Button>
                    </div>
                  </div>

                  {paymentMethod === "ETH" ? (
                    <Button
                      className="w-full h-8py-6 text-lg bg-mint text-black hover:bg-plum hover:text-black disabled:bg-gray-500 disabled:text-white/60"
                      onClick={() => handleMint(mintQuantity, false)}
                      disabled={
                        !hasEnoughEthBalance() ||
                        mintStatus === "pending" ||
                        (mintTxHash && mintTxResult.isPending)
                      }
                    >
                      {!hasEnoughEthBalance()
                        ? "INSUFFICIENT ETH BALANCE"
                        : "MINT WITH ETH"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-8py-6 text-lg bg-mint text-black hover:bg-plum hover:text-black disabled:bg-gray-500 disabled:text-white/60"
                      onClick={() => {
                        if (!hasEnoughUsdcAllowance()) {
                          handleApprove();
                        } else {
                          handleMint(mintQuantity, false);
                        }
                      }}
                      disabled={
                        !hasEnoughUsdcBalance() ||
                        allowanceStatus === "pending" ||
                        mintStatus === "pending" ||
                        (allowanceTxHash && allowanceTxResult.isPending)
                      }
                    >
                      {!hasEnoughUsdcBalance()
                        ? "INSUFFICIENT USDC BALANCE"
                        : !hasEnoughUsdcAllowance()
                        ? "APPROVE USDC"
                        : "MINT WITH USDC"}
                      {allowanceStatus === "pending" && (
                        <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                      )}
                    </Button>
                  )}

                  <div className="flex justify-between items-start text-sm">
                    <span className="text-white">Total Cost</span>
                    <div className="text-right">
                      <div>
                        {paymentMethod === "ETH"
                          ? `${(safePrice * mintQuantity).toFixed(6)} ETH`
                          : `${(usdPrice * mintQuantity).toFixed(3)} USDC`}
                      </div>
                      <div className="text-white/60 text-xs">
                        {paymentMethod === "ETH"
                          ? `$${(safePrice * mintQuantity * ethUsd).toFixed(
                              2
                            )} USD`
                          : `${((usdPrice * mintQuantity) / ethUsd).toFixed(
                              6
                            )} ETH`}
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
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-32 h-32 bg-black border border-white/90 border-2 rounded-sm relative">
                      {image ? (
                        <Image
                          src={image}
                          alt="Song artwork"
                          fill
                          className="object-cover rounded-md"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3/4 h-3/4 rounded-full border-2 border-white/40 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white/40" />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-[14px]">
                      You minted {mintQuantity} edition
                      {mintQuantity > 1 ? "s" : ""} of {formatSongId(tokenId)}
                    </p>
                    {/* {mintTxHash && (
                      <a
                        href={`https://basescan.org/tx/${mintTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline text-sm flex items-center gap-1"
                      >
                        View on Basescan
                      </a>
                    )} */}
                    <Button
                      className="w-full h-10 py-4 text-lg bg-mint text-black hover:bg-plum hover:text-black"
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
