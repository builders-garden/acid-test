import Link from "next/link";
import Logo from "@/public/images/logo.svg";
import DiscIcon from "@/public/images/disc.svg";
import QuestionIcon from "@/public/images/question.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ContextType, useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useEffect, useState } from "react";
import { usePrelaunchState } from "@/hooks/use-prelaunch-state";
import { Button } from "./button";
import { handleAddFrame } from "@/lib/utils";

interface HeaderProps {
  userAddedFrameOnAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userAddedFrameOnAction }) => {
  const pathname = usePathname();
  const isSongsPage = pathname === "/songs";
  const isAboutPage = pathname === "/about";
  const { type: contextType, context } = useMiniAppContext();
  const [loading, setLoading] = useState<boolean>(true);
  const [userAddedFrame, setUserAddedFrame] = useState<boolean>(false);
  const { isPrelaunch } = usePrelaunchState();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        const result = await response.json();

        if (result?.data?.notificationDetails) {
          setUserAddedFrame(true);
          setLoading(false);
          return;
        }

        // Fall back to context check if no notification details
        if (contextType === ContextType.Farcaster) {
          if (context && context.user.fid) {
            setUserAddedFrame(context.client.added);
          } else {
            setUserAddedFrame(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Fall back to context check on error
        if (contextType === ContextType.Farcaster) {
          if (context && context.user.fid) {
            setUserAddedFrame(context.client.added);
          } else {
            setUserAddedFrame(false);
          }
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [contextType, context]);

  const handleAddFrameAndRefresh = async () => {
    try {
      await handleAddFrame();
      setUserAddedFrame(true);
    } catch (error) {
      console.error("Error adding frame:", error);
      setUserAddedFrame(false);
    }
  };

  useEffect(() => {
    if (userAddedFrameOnAction) {
      setUserAddedFrame(true);
      setLoading(false);
    }
  }, [userAddedFrameOnAction]);

  return (
    <div className="w-full max-w-md flex justify-between items-center mb-6">
      <Link href="/?from=internal">
        <Image
          src={Logo}
          alt="ACID TEST"
          className="w-auto"
        />
      </Link>
      <div className="flex space-x-2">
        {loading || userAddedFrame === null ? (
          // Loading state
          <div className="flex space-x-2">
            <div className="w-9 h-9 bg-white/10 animate-pulse rounded-md"></div>
            <div className="w-9 h-9 bg-white/10 animate-pulse rounded-md"></div>
          </div>
        ) : userAddedFrame ? (
          isPrelaunch ? (
            <></>
          ) : (
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
          )
        ) : (
          <Button
            onClick={handleAddFrameAndRefresh}
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
