'use client'
import { Header } from "../header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-6 flex flex-col items-center w-full">
      <Header />

      <div className="w-full max-w-md space-y-8">
        {/* Main Description */}
        <div className="space-y-6">
          <p className="text-md leading-relaxed">
            ACIDTEST is an electronic music and interactive cryptocurrency project built on Farcaster.
          </p>
          <p className="text-md leading-relaxed">
            Everytime an ACIDTEST song is minted, 50% of the revenue goes to buying back $ACID on the open market.
          </p>
        </div>

        {/* Token Info Box */}
        <div className="border-2 border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">$ACID</span>
            <div className="flex gap-2 ml-auto">
              <div className="w-6 h-6 bg-white/10 rounded-md"></div>
              <div className="w-6 h-6 bg-white/10 rounded-md"></div>
              <div className="w-6 h-6 bg-white/10 rounded-md"></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-white/60">CA:</span>
              <span className="text-sm">0x123456789012345678901234567890123...</span>
   
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-white/60 text-sm">MKT CAP</div>
                <div className="text-lg">$2.8M</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">24H VOL</div>
                <div className="text-lg">$308K</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">LIQ</div>
                <div className="text-lg">$227K</div>
              </div>
            </div>
          </div>
        </div>

        {/* Official Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-mono mb-4">OFFICIAL LINKS</h2>
          <div className="grid grid-cols-2 gap-y-4">
            <div className="space-y-4">
              <a href="#" className="block text-white hover:text-white/80">ACIDPAPER</a>
              <div className="flex items-center gap-2">
                <span className="text-white hover:text-white/80">DOCS</span>
                <span className="text-xs text-black bg-[#606075] px-1">COMING SOON</span>
              </div>
              <a href="#" className="block text-white hover:text-white/80">OPENSEA</a>
              <div className="flex items-center gap-2">
                <a href="#" className="text-white hover:text-white/80">BASESCAN</a>
                <span className="text-xs text-black bg-[#606075] px-1 ">ACIDTEST NFTS</span>
              </div>
            </div>
            <div className="space-y-4">
              <a href="#" className="block text-white hover:text-white/80">TWITTER</a>
              <a href="#" className="block text-white hover:text-white/80">DEXSCREENER</a>
              <a href="#" className="block text-white hover:text-white/80">CLANKER</a>
              <div className="flex items-center gap-2">
                <a href="#" className="text-white hover:text-white/80">BASESCAN</a>
                <span className="text-xs text-black px-1 bg-[#606075]">$ACID</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
