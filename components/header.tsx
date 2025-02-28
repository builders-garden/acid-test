import Link from "next/link";
import { Button } from "./ui/button";
import { Disc, Info, House } from "lucide-react";

export const Header = () => {
  return (
    <div className="w-full max-w-md flex justify-between items-start mb-6">
      <h1 className="text-2xl font-bold tracking-tight">ACID TEST</h1>
      <div className="flex space-x-2">
        <Link href="/songs">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-lg border-2 border-white/60 bg-black hover:bg-white/10"
          >
            <Disc className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/about">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-lg border-2 border-white/60 bg-black hover:bg-white/10"
          >
            <Info className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-lg border-2 border-white/60 bg-black hover:bg-white/10"
          >
            <House className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
