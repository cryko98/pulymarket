
import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PredictionMarket from './components/PredictionMarket';
import { ShieldCheck, Skull, TrendingUp, BarChart3, Globe } from 'lucide-react';

const AboutSection = () => (
  <section className="py-24 bg-white text-blue-600 relative overflow-hidden">
    {/* Decorative Background Elements */}
    <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
        <Globe size={400} />
    </div>

    <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
      <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-md mb-6 font-black uppercase tracking-widest text-sm transform -rotate-1 shadow-lg">
        The Industry Report 2025
      </div>
      
      <h2 className="text-5xl md:text-8xl font-black mb-10 italic uppercase tracking-tighter leading-none">
        97% OF MEMECOINS DIE
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left mb-20 items-center">
        <div className="space-y-6 text-xl md:text-2xl font-bold leading-tight">
          <p>
            The memecoin casino is in a slow-motion collapse. Projects are vanishing at a rate of 
            <span className="text-red-600 font-black"> 2,000 per month.</span> 
            Since 2024, out of 7 million tokens issued, a staggering <span className="text-red-600 font-black">98.6%</span> were rug pulls or pump-and-dump schemes.
          </p>
          <p className="border-l-8 border-blue-600 pl-6 italic bg-blue-50 py-4 rounded-r-2xl">
            "The market is rotating away from pure speculation and toward platforms with actual utility."
          </p>
          <p>
            While memecoin attention collapsed by 90%, Prediction Markets exploded. 
            Polymarket crossed <span className="text-blue-800">$9 Billion</span> in volume. Kalshi reached an <span className="text-blue-800">$11 Billion</span> valuation.
          </p>
        </div>
        
        <div className="bg-blue-600 text-white p-8 rounded-[40px] shadow-2xl transform rotate-1 border-4 border-black">
          <h3 className="text-3xl font-black uppercase mb-4 italic flex items-center gap-3">
             <BarChart3 size={32} />
             The Puly Advantage
          </h3>
          <p className="text-lg font-bold mb-6 opacity-90">
            $pulymarket isn't just a ticker; it's the infrastructure for the next cycle. 
            We are shipping tools, research, and data that memecoins simply can't match.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
               <ShieldCheck className="shrink-0 mt-1" />
               <span>AI-Powered confidence scoring for every market.</span>
            </li>
            <li className="flex gap-3 items-start">
               <TrendingUp className="shrink-0 mt-1" />
               <span>Over 400,000 queries processed by our Oracle.</span>
            </li>
            <li className="flex gap-3 items-start">
               <Skull className="shrink-0 mt-1" />
               <span>Survivor-only tokenomics. Only the strong remain.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-3xl mx-auto border-t-4 border-dashed border-blue-200 pt-10">
        <p className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-blue-900">
          THE PARTY IS OVER FOR JEETS. <br/>
          <span className="bg-blue-600 text-white px-4">ONLY PULYMARKET SURVIVES.</span>
        </p>
        <p className="mt-6 text-lg font-bold opacity-60">
            Position yourself for the $19 Billion sector expansion.
        </p>
      </div>
    </div>
  </section>
);

function App() {
  return (
    <div className="min-h-screen text-white font-sans selection:bg-white selection:text-blue-600">
      <Header />
      <main>
        <Hero />
        
        {/* About Section */}
        <AboutSection />
        
        {/* Prediction Market Section */}
        <div id="markets">
          <PredictionMarket />
        </div>
      </main>
      
      <footer className="border-t border-white/20 py-12 bg-blue-900/40 mt-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-white/80">
            <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-blue-600 shadow-md">
                  <img src="https://pbs.twimg.com/media/G8bzt3JakAMwh2N?format=jpg&name=small" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black italic text-white text-2xl drop-shadow-md uppercase tracking-tighter">PULYMARKET</span>
            </div>
            <p className="mb-2 font-black uppercase tracking-widest text-sm italic">© 2025 THE LAST ORACLE STANDING</p>
            <p className="text-xs opacity-70 mb-6 max-w-sm mx-auto">
              Warning: 97% of memecoins will be dead by next month. 
              $pulymarket is building for the future of prediction markets.
            </p>
            
            <div className="flex justify-center items-center gap-2 pt-4 border-t border-white/10 w-full max-w-xs mx-auto">
                <span className="text-sm font-bold text-white/60 uppercase tracking-widest">Survivor Protocol v1.0</span>
            </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
