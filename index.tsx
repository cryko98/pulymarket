
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/Header';
import Hero from './components/Hero';
import PredictionMerket from './components/PredictionMarket';
import { BarChart3, Globe, ArrowLeft, Terminal, Layout, Share2, Activity, Zap, Cpu, Search, TrendingUp } from 'lucide-react';

const AboutSection = () => (
  <section className="py-16 md:py-24 bg-slate-950 text-white relative overflow-hidden border-y border-slate-800">
    <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
        <Globe size={400} />
    </div>

    <div className="container mx-auto px-4 max-w-6xl relative z-10">
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-block bg-blue-600 text-white px-5 py-1.5 rounded-full mb-6 font-bold uppercase tracking-widest text-xs md:text-sm shadow-xl">
          The Memecoin Evolution
        </div>
        <h2 className="text-4xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tighter leading-tight text-slate-100">
          The Meme Version of <br/><span className="text-blue-400">Polymarket.</span>
        </h2>
        <p className="text-lg md:text-xl font-medium max-w-4xl mx-auto leading-relaxed text-slate-400 px-2">
          Paying homage to the global giant, we’ve built the definitive memecoin version of Polymarket for the Solana ecosystem. This is a live prediction terminal where the community defines the meta and tracks the money.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-stretch">
        <div className="flex flex-col gap-6 md:gap-8">
          <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-sm">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3 text-slate-100">
              <Cpu size={28} className="md:w-8 md:h-8 text-blue-500" />
              Open Terminal Access
            </h3>
            <p className="text-base md:text-lg font-medium text-slate-400 leading-snug">
              Every user is an oracle. Anyone can deploy their own custom prediction market. Propose any outcome—from macro trends to the next viral moonshot—and let the community's conviction provide the answer.
            </p>
          </div>
          
          <div className="bg-blue-600 text-white p-6 md:p-8 rounded-3xl shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Share2 size={100} className="md:w-[120px] md:h-[120px]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
               <Zap size={28} className="md:w-8 md:h-8" />
               Broadcast Alpha
            </h3>
            <p className="text-base md:text-lg font-medium mb-6 opacity-90 leading-snug">
              Vote on live signals, watch sentiment shift in real-time, and broadcast your prediction cards directly to X. We've integrated social sharing to turn every market into a viral consensus layer.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest">Oracle Sync</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest">Viral Signals</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-2xl flex flex-col justify-center border border-slate-800 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 bg-blue-500 rounded-full blur-[80px] md:blur-[120px] opacity-10"></div>
          <div className="relative z-10">
            <div className="bg-blue-600 text-white w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-blue-500/20">
              <BarChart3 size={32} className="md:w-10 md:h-10" />
            </div>
            <h3 className="text-3xl md:text-5xl font-bold mb-6 leading-tight tracking-tighter">
              Live CA & <br/>MCAP Tracking
            </h3>
            <p className="text-lg md:text-xl font-medium text-slate-400 leading-relaxed mb-8">
              Bridge the gap between speculation and data. Attach any Solana memecoin contract address to your market to enable live liquidity tracking.
            </p>
            <ul className="space-y-4 font-bold uppercase text-xs md:text-sm tracking-widest text-slate-300">
              <li className="flex items-center gap-3"><TrendingUp size={16} className="text-blue-400 md:w-[18px] md:h-[18px]" /> Dexscreener Real-time API</li>
              <li className="flex items-center gap-3"><Activity size={16} className="text-blue-400 md:w-[18px] md:h-[18px]" /> Dynamic Market Cap Feeds</li>
              <li className="flex items-center gap-3"><Search size={16} className="text-blue-400 md:w-[18px] md:h-[18px]" /> Automated On-chain Tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-16 md:mt-20 text-center border-t-2 border-dashed border-slate-800 pt-10 md:pt-12">
        <p className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-100 px-2">
          THE MEME VERSION OF THE TRUTH. <br className="hidden md:block" />
          <span className="bg-blue-600 text-white px-2 md:px-4 leading-relaxed box-decoration-clone">ONLY POLYMARKET SURVIVES.</span>
        </p>
      </div>
    </div>
  </section>
);

const TerminalFeaturesSection = () => (
  <section className="py-16 md:py-24 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
    <div className="container mx-auto px-4 max-w-6xl relative z-10">
      <div className="text-center mb-12 md:mb-16">
        <div className="inline-block bg-blue-600 text-white px-5 py-1.5 rounded-full mb-6 font-bold uppercase tracking-widest text-xs md:text-sm shadow-xl">
          Terminal Update // v5.2 Live
        </div>
        <h2 className="text-3xl md:text-6xl font-bold mb-6 md:mb-8 tracking-tighter leading-tight">
          Utility for the <span className="text-blue-400">Community.</span>
        </h2>
        <p className="text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed text-slate-400 px-2">
          Our terminal is the definitive toolkit for Solana traders. Monitor price action while betting on the outcome of the meta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-slate-950 p-8 rounded-3xl shadow-xl hover:scale-105 transition-transform border border-slate-800">
          <div className="bg-blue-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <Layout size={24} className="md:w-[30px] md:h-[30px]" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-4">User-Gen Markets</h3>
          <p className="text-base md:text-lg font-medium text-slate-400 leading-snug">
            Create any market in seconds. Upload an asset, write your conviction, and deploy your signal to the global terminal feed for community voting.
          </p>
        </div>

        <div className="bg-slate-950 p-8 rounded-3xl shadow-xl hover:scale-105 transition-transform border border-slate-800">
          <div className="bg-blue-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <Activity size={24} className="md:w-[30px] md:h-[30px]" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-4">Deep Liquidity</h3>
          <p className="text-base md:text-lg font-medium text-slate-400 leading-snug">
            Monitor Market Cap movements directly on market cards. Our terminal fetches the most accurate data for your attached memecoin CA.
          </p>
        </div>

        <div className="bg-slate-950 p-8 rounded-3xl shadow-xl hover:scale-105 transition-transform border border-slate-800">
          <div className="bg-blue-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <Share2 size={24} className="md:w-[30px] md:h-[30px]" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-4">Viral Oracle</h3>
          <p className="text-base md:text-lg font-medium text-slate-400 leading-snug">
            Download your prediction results or post them directly to X. Turn your market conviction into viral social proof for your audience.
          </p>
        </div>
      </div>
    </div>
  </section>
);

function App() {
  const [hash, setHash] = useState("");
  const logoUrl = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  useEffect(() => {
    setHash(window.location.hash);
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const goToLanding = () => { window.location.hash = ''; };
  const goToTerminal = () => { window.location.hash = 'live-market'; };

  const isTerminal = hash.startsWith('#live-market');

  return (
    <div className="min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white bg-slate-900 overflow-x-hidden">
      <Header onLogoClick={goToLanding} />
      <main className="transition-all duration-500">
        {!isTerminal ? (
          <div className="animate-in fade-in duration-700">
            <Hero onStart={goToTerminal} />
            <AboutSection />
            <TerminalFeaturesSection />
          </div>
        ) : (
          <div className="pt-16 min-h-screen bg-slate-900 animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-4 md:px-8 py-3 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2 md:gap-4 text-slate-400 font-mono text-[9px] md:text-[11px] uppercase tracking-wider md:tracking-widest overflow-hidden whitespace-nowrap">
                  <Terminal size={12} className="text-blue-500 shrink-0 md:w-[14px] md:h-[14px]" />
                  <span className="truncate">Connection: Secure // Provider: PolyOracle // Live</span>
               </div>
               <button onClick={goToLanding} className="flex items-center gap-2 text-slate-200 bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-wider text-[10px] md:text-xs py-1.5 px-3 rounded-md border border-slate-700 whitespace-nowrap transition-colors">
                   <ArrowLeft size={12} className="md:w-[14px] md:h-[14px]" /> Exit
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll">
                <div className="container mx-auto px-4 py-6 md:py-16">
                   <PredictionMerket />
                </div>
            </div>
          </div>
        )}
      </main>
      <footer className="border-t border-slate-800 py-8 md:py-12 bg-slate-950 text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-slate-700 overflow-hidden bg-slate-800 shadow-md">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-slate-200 text-xl md:text-2xl uppercase tracking-tighter">Polymarket Meme</span>
        </div>
        <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-500 px-4">© 2026 THE POLYMARKET OF MEMES</p>
      </footer>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;