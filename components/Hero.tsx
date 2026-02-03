
import React from 'react';

interface HeroProps {
  onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
  const heroImageUrl = "https://pbs.twimg.com/media/G8TVwV2XgAczA4R?format=jpg&name=large";

  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Main Hero Image */}
        <div className="w-56 h-56 md:w-72 md:h-72 mx-auto mb-8 md:mb-12 transform hover:scale-[1.05] transition-transform duration-700 p-2 rounded-full border-4 border-slate-700 bg-slate-800 drop-shadow-[0_0_60px_rgba(168,85,247,0.4)]">
            <img 
                src={heroImageUrl} 
                alt="COOLCAT Hero Art" 
                className="w-full h-full object-cover rounded-full"
            />
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6">
             <span className="px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-slate-800 text-purple-400 text-xs md:text-sm font-bold uppercase tracking-wider shadow-lg border border-slate-700">
                $COOL
             </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-6 text-slate-100 leading-tight tracking-tighter drop-shadow-xl uppercase">
            COOLCAT
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-400 font-medium mb-8 md:mb-10 max-w-3xl leading-relaxed drop-shadow-md px-2">
            The coolest cat on Solana. Not just a meme, but a movement. <br className="hidden md:block"/>
            Vibe with us and predict the future of the meta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center px-4 md:px-0">
              <button 
                onClick={onStart}
                className="bg-purple-600 text-white font-bold text-lg md:text-xl px-8 py-4 rounded-full hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20 hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                  Enter Terminal
              </button>
              <a 
                  href="https://dexscreener.com/solana/COOLcatXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 text-slate-200 font-bold text-lg md:text-xl px-8 py-4 rounded-full hover:bg-slate-700 transition-all shadow-lg border border-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 w-full sm:w-auto"
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
