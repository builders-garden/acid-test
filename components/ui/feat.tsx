import Image from "next/image";
import sdk from "@farcaster/frame-sdk";
import React from "react";

export type FeatProps = {
  featuringName?: string;
  featuringPfp?: string;
  featuringText?: string;
  featuringFid?: number;
  size?: "sm" | "default";
};

export const Feat: React.FC<FeatProps> = ({
  featuringName,
  featuringPfp,
  featuringText,
  featuringFid,
  size = "default",
}) => {
  const textSize = size === "sm" ? "text-[12px]" : "text-[14px]";
  const imageSize = size === "sm" ? 16 : 20;
  const imageContainerSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  if (!featuringName) return null;
  return (
    <div className="w-fit flex justify-center">
      <div
        className={`${textSize} text-white leading-none flex items-center gap-1`}
      >
        feat.
        <button
          type="button"
          className={`flex cursor-pointer items-center gap-1 text-white hover:underline focus:outline-none px-0 py-0 bg-transparent border-none ${textSize} font-normal`}
          onClick={async (e) => {
            if (featuringFid) {
              e.preventDefault();
              e.stopPropagation();
              await sdk.actions.viewProfile({ fid: featuringFid });
            }
          }}
          style={{ appearance: "none" }}
        >
          {featuringPfp && (
            <span
              className={`inline-block ${imageContainerSize} rounded-full overflow-hidden align-middle border border-white/30`}
            >
              <Image
                src={featuringPfp}
                alt={featuringName}
                width={imageSize}
                height={imageSize}
              />
            </span>
          )}
          <span>{featuringName}</span>
        </button>
        {featuringText && (
          <span className="ml-1 text-white">{featuringText}</span>
        )}
      </div>
    </div>
  );
};
