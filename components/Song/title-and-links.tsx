import { Check, Ellipsis, Share2, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Image from "next/image";
import { composeSongCastUrl, copyToClipboard } from "@/lib/utils";
import { SongMetadata } from "@/types";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { env } from "@/lib/env";
import copy from "@/public/images/copy.svg";
import { CONTRACT_ADDRESS } from "@/lib/constants";

type TitleAndLinksProps = {
  metadata: SongMetadata | null;
  tokenId: number;
  splitsAddress?: string;
};

export const TitleAndLinks = ({
  metadata,
  tokenId,
  splitsAddress,
}: TitleAndLinksProps) => {
  const { type: contextType, context } = useMiniAppContext();

  const [linkCopied, setLinkCopied] = useState(false);
  const [composeCastParams, setComposeCastParams] = useState<{
    text: string;
    embeds: [string];
  } | null>(null);

  useEffect(() => {
    if (metadata) {
      const composeCastParams = composeSongCastUrl(tokenId, metadata.name);
      setComposeCastParams(composeCastParams);
    }
  }, [metadata, tokenId]);

  const handleShareSong = () => {
    if (
      contextType === "farcaster" &&
      context?.user?.fid &&
      composeCastParams
    ) {
      sdk.actions.composeCast(composeCastParams);
    }
  };

  const handleOpenSeaLink = () => {
    sdk.actions.openUrl(
      `https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`
    );
  };

  const handleSplitsLink = () => {
    if (splitsAddress) {
      sdk.actions.openUrl(
        `https://app.splits.org/accounts/${splitsAddress}/?chainId=8453`
      );
    } else {
      sdk.actions.openUrl(`https://app.splits.org/`);
    }
  };

  const frameUrl = `${env.NEXT_PUBLIC_URL}/songs/${tokenId}`;

  return (
    <div className="grid grid-cols-6 w-full max-w-md">
      <div className="w-full"></div>
      <div className="flex flex-col gap-2 text-center col-span-4">
        <h2 className="text-[18px] font-bold leading-none">
          {metadata?.name || "LOADING"}
        </h2>
      </div>
      <div className="flex justify-end items-start gap-4 h-fit">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hover:text-opacity-70 transition-opacity rounded outline-none"
              aria-label="Share options"
            >
              <Upload
                width={20}
                height={20}
                className="text-white"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left">
            <DropdownMenuItem
              onClick={handleShareSong}
              className="gap-2"
            >
              <Image
                src="/images/farcaster.png"
                alt=""
                width={16}
                height={16}
              />
              Share via cast
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: metadata?.name || "Song",
                      text: `Check out this song: ${metadata?.name || ""}`,
                      url: frameUrl,
                    });
                  } catch (err) {
                    // User cancelled or error
                  }
                } else {
                  await copyToClipboard(frameUrl, setLinkCopied);
                }
              }}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share to...
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async (e) => {
                e.preventDefault();
                await copyToClipboard(frameUrl, setLinkCopied);
              }}
              className="gap-2"
            >
              {linkCopied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Image
                  src={copy}
                  alt=""
                  width={16}
                  height={16}
                />
              )}
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hover:text-opacity-70 transition-opacity rounded outline-none"
              aria-label="More options"
            >
              <Ellipsis
                width={20}
                height={20}
                className="text-white"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="left">
            <DropdownMenuItem
              onClick={handleOpenSeaLink}
              className="gap-2"
            >
              <Image
                src="/images/opensea.png"
                alt=""
                width={16}
                height={16}
                className="rounded-sm"
              />
              OpenSea
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSplitsLink}
              className="gap-2"
            >
              <Image
                src="/images/splits.svg"
                alt=""
                width={16}
                height={16}
              />
              Splits
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
