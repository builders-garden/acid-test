import Image from "next/image";
import sdk from "@farcaster/miniapp-sdk";
import React from "react";
import { Skeleton } from "./skeleton";

export type FeatProps = {
  featuringUsers?: Array<{
    username: string;
    pfp: string;
    fid: number;
  }>;
  featuringText?: string;
  size?: "sm" | "default";
  isLoading?: boolean;
};

export const Feat: React.FC<FeatProps> = ({
  featuringUsers,
  featuringText,
  size = "default",
  isLoading = false,
}) => {
  const showOnlyPfps = featuringUsers?.length && featuringUsers.length > 2;

  const textSize = size === "sm" ? "text-[12px]" : "text-[14px]";
  const imageSize = size === "sm" ? 16 : showOnlyPfps ? 24 : 20;
  const imageContainerSize =
    size === "sm" ? "w-4 h-4" : showOnlyPfps ? "w-6 h-6" : "w-5 h-5";

  if (isLoading) {
    return (
      <div className="w-fit flex justify-center">
        <div
          className={`${textSize} text-white leading-none flex items-center gap-2`}
        >
          feat.
          <div className="flex items-center gap-2">
            <Skeleton
              className={`${imageContainerSize} rounded-full bg-white/20`}
            />
            <Skeleton className={`h-3 w-20 bg-white/20`} />
          </div>
        </div>
      </div>
    );
  }

  if (!featuringUsers?.length) return null;

  return (
    <div className="w-fit flex justify-center">
      <div
        className={`${textSize} text-white leading-none flex items-center gap-1`}
      >
        feat.
        <div className="flex items-center gap-1">
          {featuringUsers.map((user, index) => (
            <React.Fragment key={user.fid}>
              {!showOnlyPfps && index > 0 && <span>,</span>}
              <button
                type="button"
                className={`flex cursor-pointer items-center gap-1 text-white hover:underline focus:outline-none px-0 py-0 bg-transparent border-none ${textSize} font-normal`}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await sdk.actions.viewProfile({ fid: user.fid });
                }}
                style={{ appearance: "none" }}
              >
                <span
                  className={`inline-block ${imageContainerSize} rounded-full overflow-hidden align-middle border border-white/30`}
                >
                  <Image
                    src={user.pfp}
                    alt={user.username}
                    width={imageSize}
                    height={imageSize}
                    className="object-cover"
                  />
                </span>
                {!showOnlyPfps && <span>{user.username}</span>}
              </button>
            </React.Fragment>
          ))}
        </div>
        {featuringText && (
          <span className="ml-1 text-white">{featuringText}</span>
        )}
      </div>
    </div>
  );
};
