"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";
import { Loader2, X } from "lucide-react";
import { useBalance, useReadContract, useWriteContract } from "wagmi";
import { AcidTestABI } from "@/lib/abi/AcidTestABI";
import { toast } from "sonner";
import { CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS } from "@/lib/constants";
import { useWaitForTransactionReceipt } from "wagmi";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { erc20Abi } from "viem";
import { composeMintCastUrl, formatSongId } from "@/lib/utils";
import sdk from "@farcaster/miniapp-sdk";
import { trackEvent } from "@/lib/posthog/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { encodeFunctionData } from "viem";
import { useMiniAppStatus } from "@/contexts/MiniAppStatusContext";
import { sendCalls, getCallsStatus } from "@wagmi/core";
import { config } from "../frame-wallet-provider";
import { useCreateUser } from "@/hooks/use-create-user";
import { useSendNotification } from "@/hooks/use-send-notification";
import { useCreateCollection } from "@/hooks/use-create-collection";

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
  refetchCollectors: () => void;
  image?: string;
  refetchUserCollector: () => void;
  refetchTotalMints: () => void;
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
  refetchCollectors,
  image,
  refetchUserCollector,
  refetchTotalMints,
}: MintModalProps) {
  const WAY_MORE_MIN = 11;
  const WAY_MORE_MAX = 100;

  const [isSliderInteracting, setIsSliderInteracting] = useState(false);
  const [mintState, setMintState] = useState<MintState>(MintState.Initial);
  const [composeCastParams, setComposeCastParams] = useState<{
    text: string;
    embeds: [string];
  } | null>(null);
  const [postMintExecuted, setPostMintExecuted] = useState(false);
  const [wayMoreAccordionValue, setWayMoreAccordionValue] =
    useState<string>("");
  const [sendCallsId, setSendCallsId] = useState<string | null>(null);
  const [isSendCallsPending, setIsSendCallsPending] = useState(false);

  const presetQuantities = [1, 2, 5, 10];
  const modalRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const price = usdPrice / ethUsd;
  const safePrice = price + price * 0.01;

  const { type: contextType, context } = useMiniAppContext();

  const userFid = contextType === "farcaster" ? context.user.fid : undefined;

  // API mutation hooks
  const createUserMutation = useCreateUser();
  const sendNotificationMutation = useSendNotification();
  const createCollectionMutation = useCreateCollection();

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
      // After approval succeeds, automatically mint
      handleMint(mintQuantity, false);
    }
  }, [allowanceTxResult.isSuccess, refetchAllowance]);

  const handleApproveAndMintWithSendCalls = async () => {
    try {
      if (!userAddress) return;

      setPostMintExecuted(false);
      setIsSendCallsPending(true);

      // Encode approve function call
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, BigInt(usdPrice * mintQuantity * 10 ** 6)],
      });

      // Encode mint function call
      const mintData = encodeFunctionData({
        abi: AcidTestABI,
        functionName: "mint",
        args: [userAddress, BigInt(tokenId), BigInt(mintQuantity), false],
      });

      // Send both calls together
      const result = await sendCalls(config, {
        calls: [
          {
            to: USDC_CONTRACT_ADDRESS,
            data: approveData,
          },
          {
            to: CONTRACT_ADDRESS,
            data: mintData,
          },
        ],
      });

      const id = typeof result === "string" ? result : result.id;
      setSendCallsId(id);

      // Poll for calls status
      const checkCallsStatus = async () => {
        try {
          const status = await getCallsStatus(config, { id });

          if (status.status === "success") {
            setIsSendCallsPending(false);
            refetchAllowance();

            // Execute post-mint logic for sendCalls
            await executePostMintLogic();

            setMintState(MintState.Success);
          } else if (status.status === "pending") {
            setTimeout(checkCallsStatus, 2000);
          } else if (status.status === "failure") {
            setIsSendCallsPending(false);
            toast("Transaction failed");
          }
        } catch (error) {
          setTimeout(() => {
            refetchAllowance();
            setIsSendCallsPending(false);
          }, 5000);
        }
      };

      // Start checking status after a short delay
      setTimeout(checkCallsStatus, 2000);
    } catch (error: unknown) {
      setIsSendCallsPending(false);
      if (error instanceof Error) {
        // Check if wallet doesn't support sendCalls
        if (
          error.message.includes('Method "wallet_sendCalls" is not supported')
        ) {
          // Fallback to traditional approve-then-mint flow
          handleApproveOnly();
        } else if (!error.message.includes("The user rejected the request")) {
          toast(error.message);
        }
      }
    }
  };

  const handleApproveOnly = () => {
    try {
      if (!userAddress) return;

      writeContractAllowance({
        address: USDC_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, BigInt(usdPrice * mintQuantity * 10 ** 6)],
      });
    } catch (error: unknown) {
      // Error handled by allowanceError state
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
        setPostMintExecuted(false);
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
      // Error handled by mintError state
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
      setPostMintExecuted(false);
      if (!mintError.message.includes("The user rejected the request")) {
        toast(mintError.message);
      }
    }
  }, [mintError]);

  useEffect(() => {
    if (allowanceError) {
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

  const { promptToAddMiniApp } = useMiniAppStatus();

  // Shared post-mint logic
  const executePostMintLogic = useCallback(async () => {
    if (!userFid || postMintExecuted) return;

    setPostMintExecuted(true);

    try {
      await promptToAddMiniApp();
    } catch (error) {
      // Silent fail for mini app prompt
    }

    const signUpUser = async () => {
      if (userFid) {
        try {
          await createUserMutation.mutateAsync({ fid: userFid });
        } catch (error) {
          toast("Error signing up user");
        }
      }
    };

    const createCollection = async (): Promise<{
      position: number | null;
      amount: number | null;
    } | null> => {
      try {
        const collectionDetails = await createCollectionMutation.mutateAsync({
          userId: userFid,
          songId: tokenId,
          amount: mintQuantity,
        });

        refetchCollectors();
        refetchUserCollector();
        refetchTotalMints();

        return collectionDetails;
      } catch (error: unknown) {
        toast("Error creating collection");
        return null;
      }
    };

    const sendNotification = async (
      collectionDetails: {
        position: number | null;
        amount: number | null;
      } | null
    ) => {
      if (!userFid) return;

      const newUserPosition = collectionDetails?.position;
      try {
        const leaderboardText = newUserPosition
          ? `You're in ${newUserPosition}${
              newUserPosition % 10 === 1 && newUserPosition % 100 !== 11
                ? "st"
                : newUserPosition % 10 === 2 && newUserPosition % 100 !== 12
                ? "nd"
                : newUserPosition % 10 === 3 && newUserPosition % 100 !== 13
                ? "rd"
                : "th"
            } place on the leaderboard`
          : "You're now on the leaderboard";

        await sendNotificationMutation.mutateAsync({
          title: `You minted ${mintQuantity} ${
            mintQuantity > 1 ? "editions" : "edition"
          } of ${songName}!`,
          text: leaderboardText,
          delay: 0,
          fids: [userFid],
        });
      } catch (error) {
        toast("Error sending notification");
      }
    };

    await signUpUser();
    const collectionDetails = await createCollection();
    await sendNotification(collectionDetails);

    trackEvent("mint", {
      fid: userFid,
      songId: tokenId,
      quantity: mintQuantity,
      paymentMethod: paymentMethod,
      totalUsd: usdPrice * mintQuantity,
    });
  }, [
    userFid,
    postMintExecuted,
    promptToAddMiniApp,
    createUserMutation,
    createCollectionMutation,
    tokenId,
    mintQuantity,
    refetchCollectors,
    refetchUserCollector,
    refetchTotalMints,
    sendNotificationMutation,
    songName,
    paymentMethod,
    usdPrice,
  ]);

  useEffect(() => {
    const postMint = async () => {
      if (
        mintTxResult &&
        mintTxResult.status === "success" &&
        mintState !== MintState.Success &&
        !postMintExecuted
      ) {
        setMintState(MintState.Success);
        await executePostMintLogic();
      } else if (
        mintTxResult &&
        mintTxResult.status === "error" &&
        mintState !== MintState.Initial
      ) {
        toast("Minting failed");
        setMintState(MintState.Initial);
      }
    };
    if (!postMintExecuted) {
      postMint();
    }
  }, [mintTxResult, mintState, postMintExecuted, executePostMintLogic]);

  useEffect(() => {
    const composeCastParams = composeMintCastUrl(
      tokenId,
      songName,
      mintQuantity
    );
    setComposeCastParams(composeCastParams);
  }, [songName, tokenId, mintQuantity]);

  const handleShareMintedSong = () => {
    if (userFid && composeCastParams) {
      sdk.actions.composeCast(composeCastParams);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPostMintExecuted(false);
    }
  }, [isOpen]);

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
            <div className="flex justify-between items-center p-2 w-full">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors ml-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-[380px] flex items-center justify-center">
              {mintState === MintState.Initial && (
                <div className="p-8 pt-4 space-y-8 max-w-sm w-full">
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-sm w-full"># of editions</span>
                    <div className="grid grid-cols-5 gap-2 w-full">
                      {presetQuantities.map((quantity) => (
                        <button
                          key={quantity}
                          onClick={() => {
                            setMintQuantity(quantity);
                            setWayMoreAccordionValue("");
                          }}
                          className={`aspect-square flex items-center justify-center border-2 rounded-md text-lg transition-colors
                            ${
                              mintQuantity === quantity
                                ? "border-white text-white bg-white/10"
                                : "border-white/20 text-white/60 hover:border-white/60 hover:text-white"
                            }`}
                        >
                          {quantity}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const newValue = wayMoreAccordionValue ? "" : "more";
                          setWayMoreAccordionValue(newValue);
                          if (
                            newValue === "more" &&
                            mintQuantity < WAY_MORE_MIN
                          ) {
                            setMintQuantity(WAY_MORE_MIN);
                          }
                        }}
                        className={`aspect-square flex items-center justify-center border-2 rounded-md text-[10px] transition-colors
                          ${
                            wayMoreAccordionValue
                              ? "border-white text-white bg-white/10"
                              : "border-white/20 text-white/60 hover:border-white/60 hover:text-white"
                          }`}
                      >
                        Way More
                      </button>
                    </div>

                    <Accordion
                      type="single"
                      collapsible
                      value={wayMoreAccordionValue}
                      onValueChange={setWayMoreAccordionValue}
                      className="w-full"
                    >
                      <AccordionItem
                        value="more"
                        className="border-none"
                      >
                        <AccordionContent>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              min={WAY_MORE_MIN}
                              max={WAY_MORE_MAX}
                              step={1}
                              value={[
                                mintQuantity < WAY_MORE_MIN
                                  ? WAY_MORE_MIN
                                  : mintQuantity,
                              ]}
                              onValueChange={(value) =>
                                setMintQuantity(value[0])
                              }
                              className="flex-1"
                              onPointerDown={handleSliderPointerDown}
                              onPointerUp={handleSliderPointerUp}
                            />
                            <span className="text-sm font-medium min-w-[40px] text-right">
                              {mintQuantity}
                            </span>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <div className="space-y-2 !mt-3">
                    <span className="text-sm text-white">checkout with</span>
                    <div className="flex justify-center items-center gap-4">
                      <Button
                        variant="outline"
                        className={`flex-1 flex items-center justify-center gap-2 py-6 bg-black hover:bg-black/90 ${
                          paymentMethod === "USDC"
                            ? "border-2 border-white text-white hover:text-white"
                            : "border border-white/20 text-white/60 hover:text-white"
                        }`}
                        onClick={() => setPaymentMethod("USDC")}
                      >
                        USDC
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 flex items-center justify-center gap-2 py-6 bg-black hover:bg-black/90 ${
                          paymentMethod === "ETH"
                            ? "border-2 border-white text-white hover:text-white"
                            : "border border-white/20 text-white/60 hover:text-white"
                        }`}
                        onClick={() => setPaymentMethod("ETH")}
                      >
                        ETH
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
                          // Use sendCalls to combine approve + mint
                          handleApproveAndMintWithSendCalls();
                        } else {
                          // If already approved, just mint
                          handleMint(mintQuantity, false);
                        }
                      }}
                      disabled={
                        !hasEnoughUsdcBalance() ||
                        isSendCallsPending ||
                        allowanceStatus === "pending" ||
                        (allowanceTxHash && allowanceTxResult.isPending) ||
                        mintStatus === "pending" ||
                        (mintTxHash && mintTxResult.isPending)
                      }
                    >
                      {!hasEnoughUsdcBalance()
                        ? "INSUFFICIENT USDC BALANCE"
                        : isSendCallsPending
                        ? "MINTING"
                        : allowanceStatus === "pending" ||
                          (allowanceTxHash && allowanceTxResult.isPending)
                        ? "APPROVING"
                        : "MINT WITH USDC"}
                      {(isSendCallsPending ||
                        allowanceStatus === "pending" ||
                        (allowanceTxHash && allowanceTxResult.isPending) ||
                        mintStatus === "pending" ||
                        (mintTxHash && mintTxResult.isPending)) && (
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
                          : `${usdPrice * mintQuantity} USDC`}
                      </div>
                      <div className="text-white/60 text-xs h-[16px]">
                        {paymentMethod === "ETH" &&
                          `$${(safePrice * mintQuantity * ethUsd).toFixed(
                            2
                          )} USD`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mintState === MintState.Confirm && (
                <div className="p-8 pt-4 max-w-sm w-full relative overflow-hidden">
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
                <div className="p-8 pt-4 max-w-sm w-full">
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-32 h-32 bg-black border-2 border-white/90 rounded-sm relative">
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
                    <Button
                      className="w-full h-10 py-4 text-lg bg-mint text-black hover:bg-plum hover:text-black"
                      onClick={handleShareMintedSong}
                    >
                      Share
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
