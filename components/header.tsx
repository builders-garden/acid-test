import Link from "next/link";
import { Button } from "./ui/button";
import Logo from "@/public/images/logo.svg";
import DiscIcon from "@/public/images/disc.svg";
import QuestionIcon from "@/public/images/question.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

export const handleAddFrame = () => {
  try {
    sdk.actions.addFrame();
  } catch (error) {
    console.error("Error adding frame:", error);
  }
};

export const Header = () => {
  const pathname = usePathname();
  const isSongsPage = pathname === "/songs";
  const isAboutPage = pathname === "/about";
  const { type: contextType, context } = useMiniAppContext();
  const [userExists, setUserExists] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      if (contextType === "farcaster") {
        if (context && context.user.fid) {
          try {
            const response = await fetch(`/api/user/${context.user.fid}`);
            const data = await response.json();
            setUserExists(!!data.user);
          } catch (error) {
            console.error("Error checking user:", error);
            setUserExists(false);
          }
        } else {
          setUserExists(false);
        }
      } else {
        setUserExists(false);
      }
    };

    checkUser();
  }, [contextType, context]);

  return (
    <div className="w-full max-w-md flex justify-between items-center mb-6">
      <Link href="/">
        <Image
          src={Logo}
          alt="ACID TEST"
          className="w-auto"
        />
      </Link>
      <div className="flex space-x-2">
        {userExists === null ? (
          // Loading state
          <div className="w-9 h-9 bg-white/10 animate-pulse rounded-md"></div>
        ) : userExists ? (
          <>
            <Link href="/songs">
              <Button
                variant="outline"
                size="icon"
                className={`w-9 h-9 rounded-md border-[0.5px] border-white/60 ${
                  isSongsPage
                    ? "bg-plum hover:bg-plum"
                    : "bg-black hover:bg-[#AD82CD4D]"
                }`}
              >
                <Image
                  src={DiscIcon}
                  alt="Songs"
                  className="w-6 h-6"
                />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="icon"
                className={`w-9 h-9 rounded-md border-[0.5px] border-white/60 ${
                  isAboutPage
                    ? "bg-plum hover:bg-plum"
                    : "bg-black hover:bg-[#AD82CD4D]"
                }`}
              >
                <Image
                  src={QuestionIcon}
                  alt="About"
                  className="w-6 h-6"
                />
              </Button>
            </Link>
          </>
        ) : (
          <Button
            onClick={handleAddFrame}
            variant="outline"
            size="icon"
            className="w-full h-7 px-2 py-1 rounded-md border-[0.5px] border-white/60 bg-black hover:bg-[#AD82CD4D]"
          >
            ADD FRAME
          </Button>
        )}
      </div>
    </div>
  );
};
