
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PredictionMerket from './components/PredictionMarket';
import { ShieldCheck, Skull, TrendingUp, BarChart3, Globe, ArrowLeft, Terminal } from 'lucide-react';

const AboutSection = () => (
  <section className="py-24 bg-white text-blue-600 relative overflow-hidden">
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
            "The merket is rotating away from pure speculation and toward platforms with actual utility."
          </p>
          <p>
            While memecoin attention collapsed by 90%, Prediction Merkets exploded. 
            Polymarket crossed <span className="text-blue-800">$9 Billion</span> in volume.
          </p>
        </div>
        
        <div className="bg-blue-600 text-white p-8 rounded-[40px] shadow-2xl transform rotate-1 border-4 border-black">
          <h3 className="text-3xl font-black uppercase mb-4 italic flex items-center gap-3">
             <BarChart3 size={32} />
             The Puly Advantage
          </h3>
          <p className="text-lg font-bold mb-6 opacity-90">
            $pulymerket isn't just a ticker; it's the infrastructure for the next cycle. 
            We are shipping tools, research, and data that memecoins simply can't match.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-3 items-start">
               <ShieldCheck className="shrink-0 mt-1" />
               <span>AI-Powered confidence scoring for every merket.</span>
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
          <span className="bg-blue-600 text-white px-4">ONLY PULYMERKET SURVIVES.</span>
        </p>
      </div>
    </div>
  </section>
);

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const logoUrl = "https://pbs.twimg.com/media/G8b8OArXYAAkpHf?format=jpg&name=medium";

  // Handle URL changes (history API)
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Custom event listener for internal navigations
    window.addEventListener('app-navigate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('app-navigate', handleLocationChange);
    };
  }, []);

  const navigateTo = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    window.dispatchEvent(new Event('app-navigate'));
  };

  const goToLanding = () => {
    navigateTo('/');
    window.location.hash = ''; // Clear hash
  };

  const goToTerminal = () => {
    navigateTo('/live-market');
  };

  const isTerminal = path === '/live-market';

  return (
    <div className="min-h-screen text-white font-sans selection:bg-white selection:text-blue-600">
      <Header onLogoClick={goToLanding} />
      
      <main className="transition-all duration-500">
        {!isTerminal ? (
          <div className="animate-in fade-in duration-700">
            <Hero onStart={goToTerminal} />
            <AboutSection />
          </div>
        ) : (
          <div className="pt-20 min-h-screen bg-blue-700 animate-in slide-in-from-right duration-500">
            <div className="container mx-auto px-4 py-10">
                <button 
                  onClick={goToLanding}
                  className="flex items-center gap-2 text-white/70 hover:text-white font-black uppercase italic tracking-widest text-sm mb-12 transition-all hover:-translate-x-1"
                >
                   <ArrowLeft size={16} /> Exit Terminal
                </button>
                
                <div className="bg-black/20 p-4 md:p-8 rounded-[3rem] border-4 border-white/10 shadow-2xl backdrop-blur-sm">
                   <div className="flex items-center gap-3 mb-10 text-white/50 font-mono text-[10px] uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">
                      <Terminal size={12} className="shrink-0" />
                      Connection: Secure // Provider: PulyOracle_v5 // Status: Live // Path: {path}
                   </div>
                   <PredictionMerket />
                </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="border-t border-white/20 py-12 bg-blue-900/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-white/80">
            <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-blue-600 shadow-md">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black italic text-white text-2xl drop-shadow-md uppercase tracking-tighter">PULYMERKET</span>
            </div>
            <p className="mb-2 font-black uppercase tracking-widest text-sm italic">© 2025 THE SOLE SURVIVOR</p>
            <div className="text-xs opacity-50 mt-4 font-mono">ROUTING_ACTIVE // TERMINAL_READY</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
