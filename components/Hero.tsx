
import React from 'react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  // Correct image for Logo, Favicon and Hero as requested
  const heroImageUrl = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  return (
    <section className="relative pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Main Hero Image - Frameless, high-impact presentation */}
        <div className="w-full max-w-[300px] md:max-w-[450px] mx-auto mb-12 transform hover:scale-[1.05] transition-transform duration-700 flex items-center justify-center">
            <img 
                src={heroImageUrl} 
                alt="Polymarket Hero Art" 
                className="w-full h-auto block drop-shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            />
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6">
             <span className="px-5 py-2 rounded-full bg-white text-blue-600 text-sm font-black uppercase tracking-wider shadow-lg border-2 border-blue-600">
                $Polymarket
             </span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black mb-6 text-white text-outline leading-tight tracking-tight drop-shadow-xl uppercase italic">
            Polymarket
          </h1>
          
          <p className="text-xl md:text-2xl text-white font-bold mb-10 max-w-2xl leading-relaxed drop-shadow-md">
            Globally recognized and cited by the world's leading icons.<br/>
            We've engineered the definitive memecoin evolution of Polymarket, now live on USD1.
          </p>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center">
              <button 
                onClick={onStart}
                className="bg-white text-blue-600 font-black text-xl px-12 py-4 rounded-full hover:bg-gray-100 transition-all shadow-xl hover:scale-105 active:scale-95 border-b-4 border-gray-300"
              >
                  Enter Terminal
              </button>
              <a 
                  href="https://dexscreener.com/solana/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white font-black text-xl px-12 py-4 rounded-full hover:bg-blue-700 transition-all shadow-lg border-2 border-white flex items-center justify-center hover:scale-105 active:scale-95"
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
