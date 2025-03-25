import Link from "next/link";
import { Button } from "./ui/button";
import Logo from "@/public/images/logo.svg";
import DiscIcon from "@/public/images/disc.svg";
import HouseIcon from "@/public/images/house.svg";
import QuestionIcon from "@/public/images/question.svg";
import Image from "next/image";
import { usePathname } from "next/navigation";

export const Header = () => {
  const pathname = usePathname();
  const isSongsPage = pathname === "/songs";
  const isAboutPage = pathname === "/about";
  const isHomePage = pathname === "/";
  return (
    <div className="w-full max-w-md flex justify-between items-center mb-6">
      <Image
        src={Logo}
        alt="ACID TEST"
        className="w-auto"
      />
      <div className="flex space-x-2">
        <Link href="/songs">
          <Button
            variant="outline"
            size="icon"
            className={`w-9 h-9 rounded-md border-[0.5px] border-white/60 ${
              isSongsPage
                ? "bg-plum hover:bg-[#AD82CD4D]"
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
                ? "bg-plum hover:bg-[#AD82CD4D]"
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
        <Link href="/">
          <Button
            variant="outline"
            size="icon"
            className={`w-9 h-9 rounded-md border-[0.5px] border-white/60 ${
              isHomePage
                ? "bg-plum hover:bg-[#AD82CD4D]"
                : "bg-black hover:bg-[#AD82CD4D]"
            }`}
          >
            <Image
              src={HouseIcon}
              alt="Home"
              className="w-6 h-6"
            />
          </Button>
        </Link>
      </div>
    </div>
  );
};
