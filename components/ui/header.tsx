import Link from "next/link";
import Logo from "@/public/images/logo.svg";
import DiscIcon from "@/public/images/disc.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { usePrelaunchState } from "@/hooks/use-prelaunch-state";
import { Button } from "./button";
import { AboutDialog } from "./about-dialog";
import { useMiniAppStatus } from "@/contexts/MiniAppStatusContext";

interface HeaderProps {
  userAddedFrameOnAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userAddedFrameOnAction }) => {
  const pathname = usePathname();
  const isSongsPage = pathname === "/songs";
  const isHomePage = pathname === "/";
  const { isPrelaunch } = usePrelaunchState();
  const {
    userAddedMiniApp,
    setUserAddedMiniApp,
    isLoading,
    promptToAddMiniApp,
  } = useMiniAppStatus();

  useEffect(() => {
    if (userAddedFrameOnAction) {
      setUserAddedMiniApp(true);
    }
  }, [userAddedFrameOnAction, setUserAddedMiniApp]);

  useEffect(() => {
    if (!userAddedMiniApp && !isLoading && !userAddedFrameOnAction) {
      const hasPromptedThisSession = localStorage.getItem(
        "hasPromptedForMiniApp"
      );
      if (!hasPromptedThisSession) {
        promptToAddMiniApp();
        localStorage.setItem("hasPromptedForMiniApp", "true");
      }
    }
  }, [userAddedMiniApp, isLoading, userAddedFrameOnAction, promptToAddMiniApp]);

  return (
    <div className="w-full max-w-md flex justify-between items-center h-[36.5px]">
      <Link href="/?from=internal">
        <Image
          src={Logo}
          alt="ACID TEST"
          className="w-auto"
        />
      </Link>
      <div className="flex space-x-2">
        {isLoading ? (
          <div className="flex space-x-2">
            <div className="w-9 h-9 bg-white/10 animate-pulse rounded-md"></div>
            <div className="w-9 h-9 bg-white/10 animate-pulse rounded-md"></div>
          </div>
        ) : userAddedMiniApp || !isHomePage ? (
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
              <AboutDialog />
            </>
          )
        ) : (
          <Button
            onClick={promptToAddMiniApp}
            variant="outline"
            size="icon"
            className="w-full h-7 px-2 py-1 rounded-md border-[0.5px] border-white/60 bg-black hover:bg-[#AD82CD4D] hover:text-white"
          >
            ADD MINIAPP
          </Button>
        )}
      </div>
    </div>
  );
};
