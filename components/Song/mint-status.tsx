import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import sdk from "@farcaster/frame-sdk";
import Image from "next/image";

type MintStatusProps = {
  status: "live" | "end";
  countdown: number;
  setIsMintModalOpen: (open: boolean) => void;
  tokenId: number;
};

export const MintStatus = ({
  status,
  countdown,
  setIsMintModalOpen,
  tokenId,
}: MintStatusProps) => {
  const handleOpenUrl = async () => {
    await sdk.actions.openUrl(
      `https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`
    );
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-4 mb-6">
      {status === "live" ? (
        <Button
          className="w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black"
          onClick={() => setIsMintModalOpen(true)}
        >
          MINT
        </Button>
      ) : (
        <Button
          className="flex gap-4 w-full h-10 text-lg bg-mint text-black hover:bg-plum hover:text-black"
          onClick={handleOpenUrl}
        >
          COLLECT ON
          <Image
            src="/images/opensea.png"
            alt="OpenSea"
            width={20}
            height={20}
            className="rounded-sm invert"
          />
        </Button>
      )}
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          {status === "live" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              <span className="text-sm">Mint Open</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <span className="text-sm">Mint Ended</span>
            </>
          )}
        </div>
        {status === "live" && (
          <div className="text-sm font-mono">{formatCountdown(countdown)}</div>
        )}
      </div>
    </div>
  );
};
