import Image from "next/image";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { DbCollection } from "@/lib/types";
import sdk from "@farcaster/frame-sdk";

type CollectorItemProps = {
  collector: DbCollection;
  position: number;
  tokenId: number;
  isUser?: boolean;
  onClickUser?: (fid: number) => void;
};

export const CollectorItem = ({
  collector,
  position,
  tokenId,
  isUser = false,
  onClickUser = () => {},
}: CollectorItemProps) => {
  const handleOpenUrl = async () => {
    await sdk.actions.openUrl(
      `https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`
    );
  };

  return (
    <div
      className={`flex items-center justify-between p-2 rounded border ${
        isUser ? "border-white/90 bg-[#FFFFFF33]/20" : "border-white/100"
      }`}
    >
      <div
        className={`flex items-center gap-2 ${!isUser ? "cursor-pointer" : ""}`}
        onClick={
          collector?.user && collector.user?.fid
            ? () => onClickUser(collector.user?.fid!)
            : undefined
        }
      >
        <div className="w-6 h-6 flex items-center justify-center text-xs">
          {position}
        </div>
        <div className="w-6 h-6 overflow-hidden rounded-full">
          <Image
            src={
              collector.user?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${
                isUser ? "You" : collector.user?.username || "User"
              }&background=random&size=32`
            }
            alt={`${
              isUser ? "Your" : collector.user?.username || "User"
            } profile`}
            width={24}
            height={24}
            className="w-full h-full object-cover"
            placeholder="blur"
            blurDataURL={`https://ui-avatars.com/api/?name=${
              isUser ? "You" : collector.user?.username || "User"
            }&background=random&size=32`}
          />
        </div>
        <span>
          {isUser
            ? "You"
            : collector.user?.username || `User ${collector.userId}`}
        </span>
      </div>
      <span
        className="cursor-pointer"
        onClick={handleOpenUrl}
      >
        {collector.amount}
      </span>
    </div>
  );
};
