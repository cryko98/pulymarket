
import React from 'react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  // Back to original logo as requested
  const heroImageUrl = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20">
      <div className="container mx-auto px-4">
        
        {/* Main Hero Image - Frameless, high-impact presentation */}
        <div className="w-64 md:w-full md:max-w-[400px] mx-auto mb-8 md:mb-12 transform hover:scale-[1.05] transition-transform duration-700 flex items-center justify-center">
            <img 
                src={heroImageUrl} 
                alt="Polymarket Hero Art" 
                className="w-full h-auto block drop-shadow-[0_0_60px_rgba(255,255,255,0.2)] rounded-full border-4 border-white/10"
            />
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6">
             <span className="px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-white text-blue-600 text-xs md:text-sm font-black uppercase tracking-wider shadow-lg border-2 border-blue-600">
                $Polymarket
             </span>
          </div>

          <h1 className="text-5xl md:text-9xl font-black mb-6 text-white text-outline leading-tight tracking-tight drop-shadow-xl uppercase italic">
            Polymarket
          </h1>
          
          <p className="text-lg md:text-2xl text-white font-bold mb-8 md:mb-10 max-w-2xl leading-relaxed drop-shadow-md px-2">
            Globally recognized and cited by the world's leading icons.<br className="hidden md:block"/>
            We've engineered the definitive memecoin evolution of Polymarket, now live on USD1.
          </p>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center px-4 md:px-0">
              <button 
                onClick={onStart}
                className="bg-white text-blue-600 font-black text-lg md:text-xl px-8 py-4 rounded-full hover:bg-gray-100 transition-all shadow-xl hover:scale-105 active:scale-95 border-b-4 border-gray-300 w-full md:w-auto"
              >
                  Enter Terminal
              </button>
              <a 
                  href="https://dexscreener.com/solana/xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white font-black text-lg md:text-xl px-8 py-4 rounded-full hover:bg-blue-700 transition-all shadow-lg border-2 border-white flex items-center justify-center hover:scale-105 active:scale-95 w-full md:w-auto"
              >
                  Chart
              </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
