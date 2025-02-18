import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto min-h-screen bg-black text-white font-mono p-6 w-full">
      <div className="mb-6">
        <Link href="/songs/latest">
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold mb-4">About Acid Test</h1>
          <p className="text-white/80 leading-relaxed">
            Acid Test is a music brand releasing exclusive tracks onchain
            through limited edition NFTs. Each release is available for 5 hours
            at $1 per NFT.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Links</h2>
          <div className="space-y-2">
            <a
              href="https://opensea.io/collection/acid-test"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-white/80 hover:text-white"
            >
              OpenSea
            </a>
            <a
              href="https://twitter.com/acidtest"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-white/80 hover:text-white"
            >
              Twitter
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
