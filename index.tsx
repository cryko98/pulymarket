
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Header from './components/Header';
import Hero from './components/Hero';
import PredictionMerket from './components/PredictionMarket';
import NewsTerminal from './components/NewsTerminal';
import { ShieldCheck, Skull, TrendingUp, BarChart3, Globe, ArrowLeft, Terminal, Layout, Share2, Activity, Zap, Cpu, Search } from 'lucide-react';

const AboutSection = () => (
  <section className="py-24 bg-white text-blue-600 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
        <Globe size={400} />
    </div>

    <div className="container mx-auto px-4 max-w-6xl relative z-10">
      <div className="text-center mb-16">
        <div className="inline-block bg-blue-600 text-white px-5 py-1.5 rounded-md mb-6 font-black uppercase tracking-widest text-sm transform -rotate-1 shadow-xl">
          The Memecoin Evolution // Solana Native
        </div>
        <h2 className="text-5xl md:text-8xl font-black mb-8 italic uppercase tracking-tighter leading-none text-blue-900">
          The Meme Version of <br/><span className="text-blue-600">Polymarket.</span>
        </h2>
        <p className="text-xl md:text-2xl font-bold max-w-4xl mx-auto leading-relaxed text-blue-800/80 italic">
          Paying homage to the global giant, we’ve built the definitive memecoin version of Polymarket for the Solana ecosystem. This is a live prediction terminal where the community defines the meta and tracks the money.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
        <div className="flex flex-col gap-8">
          <div className="bg-blue-50 p-8 rounded-[40px] border-l-8 border-blue-600 shadow-sm">
            <h3 className="text-3xl font-black uppercase italic mb-4 flex items-center gap-3 text-blue-900">
              <Cpu size={32} />
              Open Terminal Access
            </h3>
            <p className="text-lg font-bold text-blue-800/80 leading-snug">
              Every user is an oracle. Anyone can deploy their own custom prediction market. Propose any outcome—from macro trends to the next viral moonshot—and let the community's conviction provide the answer.
            </p>
          </div>
          
          <div className="bg-blue-600 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Share2 size={120} />
            </div>
            <h3 className="text-3xl font-black uppercase mb-4 italic flex items-center gap-3">
               <Zap size={32} />
               Broadcast Alpha
            </h3>
            <p className="text-lg font-bold mb-6 opacity-90 leading-snug">
              Vote on live signals, watch sentiment shift in real-time, and broadcast your prediction cards directly to X. We've integrated social sharing to turn every market into a viral consensus layer.
            </p>
            <div className="flex gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Oracle Sync</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">Viral Signals</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-900 text-white p-10 rounded-[50px] shadow-2xl flex flex-col justify-center border-4 border-blue-400/20 relative">
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-500 rounded-full blur-[120px] opacity-30"></div>
          <div className="relative z-10">
            <div className="bg-blue-500 text-white w-16 h-16 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-400/50">
              <BarChart3 size={40} />
            </div>
            <h3 className="text-4xl md:text-5xl font-black uppercase italic mb-6 leading-[0.9] tracking-tighter">
              Live CA & <br/>MCAP Tracking
            </h3>
            <p className="text-xl font-bold opacity-80 leading-relaxed mb-8">
              Bridge the gap between speculation and data. Attach any Solana memecoin contract address to your market to enable live liquidity tracking.
            </p>
            <ul className="space-y-4 font-black italic uppercase text-sm tracking-widest">
              <li className="flex items-center gap-3"><TrendingUp size={18} className="text-blue-400" /> Dexscreener Real-time API</li>
              <li className="flex items-center gap-3"><Activity size={18} className="text-blue-400" /> Dynamic Market Cap Feeds</li>
              <li className="flex items-center gap-3"><Search size={18} className="text-blue-400" /> Automated On-chain Tracking</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center border-t-2 border-dashed border-blue-200 pt-12">
        <p className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-blue-900">
          THE MEME VERSION OF THE TRUTH. <br/>
          <span className="bg-blue-600 text-white px-4">ONLY POLYMARKET SURVIVES.</span>
        </p>
      </div>
    </div>
  </section>
);

const TerminalFeaturesSection = () => (
  <section className="py-24 bg-blue-50 text-blue-900 relative overflow-hidden border-t border-blue-200">
    <div className="container mx-auto px-4 max-w-6xl relative z-10">
      <div className="text-center mb-16">
        <div className="inline-block bg-blue-600 text-white px-5 py-1.5 rounded-md mb-6 font-black uppercase tracking-widest text-sm shadow-xl">
          Terminal Update // v5.2 Live
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-8 italic uppercase tracking-tighter leading-tight">
          Utility for the <span className="text-blue-600">Community.</span>
        </h2>
        <p className="text-xl md:text-2xl font-bold max-w-3xl mx-auto leading-relaxed text-blue-800/70 italic">
          Our terminal is the definitive toolkit for Solana traders. Monitor price action while betting on the outcome of the meta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-10 rounded-[40px] shadow-xl hover:scale-105 transition-transform border border-blue-100">
          <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-300">
            <Layout size={30} />
          </div>
          <h3 className="text-2xl font-black uppercase italic mb-4">User-Gen Markets</h3>
          <p className="text-lg font-bold text-blue-800/80 leading-snug">
            Create any market in seconds. Upload an asset, write your conviction, and deploy your signal to the global terminal feed for community voting.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-xl hover:scale-105 transition-transform border border-blue-100">
          <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-300">
            <Activity size={30} />
          </div>
          <h3 className="text-2xl font-black uppercase italic mb-4">Deep Liquidity</h3>
          <p className="text-lg font-bold text-blue-800/80 leading-snug">
            Monitor Market Cap movements directly on market cards. Our terminal fetches the most accurate data for your attached memecoin CA.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-xl hover:scale-105 transition-transform border border-blue-100">
          <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-300">
            <Share2 size={30} />
          </div>
          <h3 className="text-2xl font-black uppercase italic mb-4">Viral Oracle</h3>
          <p className="text-lg font-bold text-blue-800/80 leading-snug">
            Download your prediction results or post them directly to X. Turn your market conviction into viral social proof for your audience.
          </p>
        </div>
      </div>
    </div>
  </section>
);

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [prefilledMarket, setPrefilledMarket] = useState<{question: string, description: string} | null>(null);
  const logoUrl = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  useEffect(() => {
    const path = window.location.pathname;
    if (path !== '/' && path !== '/index.html' && !window.location.hash) {
      const slug = path.replace(/^\/+/, '');
      if (slug) window.location.hash = `live-market:${slug}`;
    }
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const goToLanding = () => { window.location.hash = ''; };
  const goToTerminal = () => { window.location.hash = 'live-market'; };

  const handleCreateFromNews = (item: any) => {
    setPrefilledMarket({
      question: item.suggestedQuestion,
      description: `Ref: ${item.title}. ${item.summary}`
    });
    goToTerminal();
  };

  const isTerminal = hash.startsWith('#live-market');

  return (
    <div className="min-h-screen text-white font-sans selection:bg-white selection:text-blue-600 bg-blue-700 overflow-x-hidden">
      <Header onLogoClick={goToLanding} />
      
      <main className="transition-all duration-500">
        {!isTerminal ? (
          <div className="animate-in fade-in duration-700">
            <Hero onStart={goToTerminal} />
            <AboutSection />
            <TerminalFeaturesSection />
            <NewsTerminal onCreateMarketFromNews={handleCreateFromNews} />
          </div>
        ) : (
          <div className="pt-16 min-h-screen bg-blue-700 animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="bg-black/40 border-b border-white/10 px-4 md:px-8 py-3 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4 text-white/60 font-mono text-[9px] md:text-[11px] uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">
                  <Terminal size={14} className="text-white shrink-0" />
                  <span>Connection: Secure // Provider: PolyOracle_v5 // Status: Live // Version: MEME_EDITION</span>
               </div>
               <button 
                  onClick={goToLanding}
                  className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/20 font-black uppercase italic tracking-widest text-xs py-1 px-3 rounded-md border border-white/20"
                >
                   <ArrowLeft size={14} /> Exit Terminal
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scroll">
                <div className="container mx-auto px-4 py-8 md:py-16">
                   <PredictionMerket 
                    initialCreateData={prefilledMarket} 
                    onClearInitialData={() => setPrefilledMarket(null)} 
                   />
                </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="border-t border-white/20 py-12 bg-blue-900/40 backdrop-blur-sm text-center">
        <div className="container mx-auto px-4 text-center text-white/80">
            <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-blue-600 shadow-md">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black italic text-white text-2xl drop-shadow-md uppercase tracking-tighter">POLYMARKET MEME</span>
            </div>
            <p className="mb-2 font-black uppercase tracking-widest text-sm italic">© 2025 THE SOLE SURVIVOR</p>
        </div>
      </footer>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
