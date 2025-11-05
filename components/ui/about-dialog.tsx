import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./button";
import About from "../About";
import Image from "next/image";
import QuestionIcon from "@/public/images/question.svg";

export const AboutDialog = () => {
  return (
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
        <DialogTitle className="sr-only">About ACID TEST</DialogTitle>
        <DialogDescription className="sr-only">
          Information about ACID TEST, including token details, market data, and
          official links.
        </DialogDescription>
        <About />
      </DialogContent>
    </Dialog>
  );
};
