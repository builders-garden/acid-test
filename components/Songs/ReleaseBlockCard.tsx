import Link from "next/link";
import Image from "next/image";
import QuestionMark from "@/public/images/question_mark.png";
import { ReleaseBlock } from ".";
import { Feat } from "@/components/ui/feat";
import { getFeaturingDetails } from "@/lib/utils";

interface ReleaseBlockCardProps {
  release: ReleaseBlock;
  onClick?: () => void;
  asLink?: boolean;
}

export function ReleaseBlockCard({
  release,
  onClick,
  asLink = false,
}: ReleaseBlockCardProps) {
  const {
    name: featuringName,
    pfp: featuringPfp,
    text: featuringText,
    fid: featuringFid,
  } = getFeaturingDetails(release.index);

  // Config for status-dependent content
  const statusConfig = {
    live: {
      badge: (
        <span className="text-sm leading-none text-white/60">{release.id}</span>
      ),
      right: (
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm leading-none">Mint Open</div>
          <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
        </div>
      ),
      cardClass:
        "border border-white/50 rounded-[8px] p-4 hover:bg-[#463B3A66] transition-colors w-full",
      subtitleClass: "text-sm text-white leading-none",
      borderClass: "border border-white/60",
    },
    end: {
      badge: (
        <span className="text-sm leading-none text-white/60">{release.id}</span>
      ),
      right: (
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm leading-none">XXX mints</div>
          {/* <div className="w-2 h-2 rounded-full bg-plum" /> */}
        </div>
      ),
      cardClass:
        "border border-white/50 rounded-[8px] p-4 hover:bg-[#463B3A66] transition-colors w-full",
      subtitleClass: "text-sm text-white/40 leading-none",
      borderClass: "border border-white/40",
    },
    coming: {
      badge: (
        <span className="text-sm leading-none text-white/60">{release.id}</span>
      ),
      right: (
        <div className="flex items-center gap-2">
          <div className="font-mono text-sm leading-none">Coming Soon</div>
          <div className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      ),
      cardClass: "border border-white/50 rounded-[8px] p-4 w-full",
      subtitleClass: "text-sm text-white/40 leading-none",
      borderClass: "border border-white/60",
    },
    redacted: {
      badge: (
        <span className="text-sm leading-none text-white/60">{release.id}</span>
      ),
      right: (
        <div className="flex items-center gap-2 text-white/60">
          <span className="font-mono text-sm leading-none">Coming Soon</span>
          <div className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      ),
      cardClass:
        "w-full border border-white/20 opacity-50 rounded-lg p-4 bg-black/60",
      subtitleClass: "text-sm text-white leading-none",
      borderClass: "border border-white/10",
    },
  } as const;

  const cfg = statusConfig[release.status];

  let imageContent;
  if (release.status === "redacted") {
    imageContent = (
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={QuestionMark}
          alt={"Redacted"}
          fill
          className="object-cover"
        />
      </div>
    );
  } else if (release.image) {
    imageContent = (
      <Image
        src={release.image}
        alt={release.title}
        fill
        className="object-cover"
      />
    );
  } else {
    imageContent = (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`w-12 h-12 rounded-full border ${
            release.status === "coming" ? "border-white/20" : "border-white/40"
          } flex items-center justify-center`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              release.status === "coming" ? "bg-white/20" : "bg-white/40"
            }`}
          />
        </div>
      </div>
    );
  }

  let titleContent;
  if (release.status === "redacted") {
    titleContent = (
      <h2 className="text-xl text-mono leading-none bg-white/60 text-transparent select-none rounded-[1px] w-[100%]">
        _
      </h2>
    );
  } else {
    titleContent = (
      <h2 className="text-[18px] text-mono leading-none">
        {release.title.toUpperCase()}
      </h2>
    );
  }

  const cardBody = (
    <div className="flex gap-4 relative">
      <div
        className={`w-20 h-20 bg-black ${cfg.borderClass} rounded relative flex-shrink-0 overflow-hidden`}
      >
        {imageContent}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between h-20">
        <div className="flex flex-col gap-2">
          {titleContent}
          {release.status === "redacted" ? (
            <h3 className="text-xs text-mono leading-none bg-white/60 text-transparent select-none rounded-[1px] w-[33%]">
              _
            </h3>
          ) : (
            <Feat
              featuringName={featuringName}
              featuringPfp={featuringPfp}
              featuringText={featuringText}
              featuringFid={featuringFid}
              size="sm"
            />
          )}
        </div>
        <div className="flex justify-between items-end w-full">
          {cfg.badge}
          {cfg.right}
        </div>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link
        href={`/songs/${release.index}`}
        className="w-full"
        onClick={onClick}
      >
        <div className={cfg.cardClass}>{cardBody}</div>
      </Link>
    );
  }
  return <div className={cfg.cardClass}>{cardBody}</div>;
}
