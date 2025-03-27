import Image from "next/image";
import Link from "next/link";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { DbCollection } from "@/lib/types";

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
        <div className="w-6 h-6 rounded-full border flex items-center justify-center text-xs">
          {position}
        </div>
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
          className="rounded-full"
        />
        <span>
          {isUser
            ? "You"
            : collector.user?.username || `User ${collector.userId}`}
        </span>
      </div>
      <Link
        href={`https://opensea.io/assets/base/${CONTRACT_ADDRESS}/${tokenId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`cursor-pointer ${isUser ? "hover:underline" : ""}`}
      >
        {collector.amount}
      </Link>
    </div>
  );
};
