
import React from 'react';

const Hero: React.FC = () => {
  const logoUrl = "https://pbs.twimg.com/media/G8bzt3JakAMwh2N?format=jpg&name=small";

  return (
    <section className="relative pt-32 pb-20">
      <div className="container mx-auto px-4">
        
        {/* 1. Image Area - Logo in circle */}
        <div className="w-full max-w-sm mx-auto mb-10 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-white transform hover:scale-105 transition-transform duration-500 bg-blue-600">
            <img 
                src={logoUrl} 
                alt="Puly Logo" 
                className="w-full h-auto block"
            />
        </div>

        {/* 2. Text Content */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="mb-6">
             <span className="px-5 py-2 rounded-full bg-white text-blue-600 text-sm font-black uppercase tracking-wider shadow-lg border-2 border-blue-600">
                $pulymerket
             </span>
          </div>

          <h1 className="text-6xl md:text-9xl font-black mb-6 text-white text-outline leading-tight tracking-tight drop-shadow-xl uppercase italic">
            PULY MERKET
          </h1>
          
          <p className="text-xl md:text-2xl text-white font-bold mb-10 max-w-2xl leading-relaxed drop-shadow-md">
            The blue bird has spoken. Bet on the future.<br/>
            Accuracy meets memes on the Solana chain.
          </p>

          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center">
                <button 
                  onClick={() => document.getElementById('merkets')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-blue-600 font-black text-xl px-12 py-4 rounded-full hover:bg-gray-100 transition-all shadow-xl hover:scale-105 active:scale-95 border-b-4 border-gray-300"
                >
                    Start Predicting
                </button>
                <a 
                    href="https://dexscreener.com/solana/acg6zmvvk4uybkhrmfxbfmvnesrxtp9prrkch1kq9rte"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white font-black text-xl px-12 py-4 rounded-full hover:bg-blue-700 transition-all shadow-lg border-2 border-white flex items-center justify-center hover:scale-105 active:scale-95"
                >
                    View Chart
                </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
