import Link from "next/link";
import Logo from "@/public/images/logo.svg";
import DiscIcon from "@/public/images/disc.svg";
import QuestionIcon from "@/public/images/question.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { usePrelaunchState } from "@/hooks/use-prelaunch-state";
import { Button } from "./button";
import { useFrameStatus } from "@/contexts/FrameStatusContext";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import About from "../About";

interface HeaderProps {
  userAddedFrameOnAction?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userAddedFrameOnAction }) => {
  const pathname = usePathname();
  const isSongsPage = pathname === "/songs";
  const isHomePage = pathname === "/";
  const { isPrelaunch } = usePrelaunchState();
  const { userAddedFrame, setUserAddedFrame, isLoading, promptToAddFrame } =
    useFrameStatus();

  useEffect(() => {
    if (userAddedFrameOnAction) {
      setUserAddedFrame(true);
    }
  }, [userAddedFrameOnAction, setUserAddedFrame]);

  useEffect(() => {
    if (!userAddedFrame && !isLoading && !userAddedFrameOnAction) {
      const hasPromptedThisSession = localStorage.getItem(
        "hasPromptedForFrame"
      );
      if (!hasPromptedThisSession) {
        promptToAddFrame();
        localStorage.setItem("hasPromptedForFrame", "true");
      }
    }
  }, [userAddedFrame, isLoading, userAddedFrameOnAction, promptToAddFrame]);

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
        ) : userAddedFrame || !isHomePage ? (
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-9 h-9 rounded-md border-[0.5px] border-white/60 bg-black hover:bg-[#AD82CD4D]"
                  >
                    <Image
                      src={QuestionIcon}
                      alt="About"
                      className="w-6 h-6"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black text-white border-white/20 p-0 max-h-[90vh] overflow-y-auto max-w-[90%] rounded-lg">
                  <About />
                </DialogContent>
              </Dialog>
            </>
          )
        ) : (
          <Button
            onClick={promptToAddFrame}
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
