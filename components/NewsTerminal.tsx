
import React, { useEffect, useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Zap, Globe, ExternalLink, Loader2, Radio, TrendingUp, Plus } from 'lucide-react';

interface NewsItem {
  title: string;
  summary: string;
  suggestedQuestion: string;
  sourceUrl?: string;
}

interface NewsTerminalProps {
  onCreateMarketFromNews?: (item: NewsItem) => void;
}

const NewsTerminal: React.FC<NewsTerminalProps> = ({ onCreateMarketFromNews }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealTimeNews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Identify the top 4 most recent and significant news stories today (political, sports, tech, or finance) that would make excellent high-stakes prediction markets on Polymarket. For each story: 1. A catchy Title. 2. A 2-sentence Summary. 3. A clear 'Yes/No' Prediction Question. Use Google Search for the latest events.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                suggestedQuestion: { type: Type.STRING }
              },
              required: ["title", "summary", "suggestedQuestion"]
            }
          }
        },
      });

      // Extract raw JSON
      const items: NewsItem[] = JSON.parse(response.text);
      
      // Extract grounding links if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter((c: any) => c.web && c.web.uri)
        .map((c: any) => c.web.uri);

      // Distribute links to items (best effort matching)
      const newsWithLinks = items.map((item, idx) => ({
        ...item,
        sourceUrl: sources[idx] || sources[0] // fallback to first link if not enough
      }));

      setNews(newsWithLinks);
    } catch (err) {
      console.error("News fetch error:", err);
      setError("Failed to sync with global oracle nodes. Retrying...");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeNews();
    const interval = setInterval(fetchRealTimeNews, 600000); // Refresh every 10 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-[#020617] relative overflow-hidden border-t border-blue-500/20">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] animate-pulse">
              <Radio className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                Real-Time <span className="text-blue-500">Oracle Feed</span>
              </h2>
              <p className="text-blue-400 font-mono text-[10px] tracking-[0.4em] uppercase mt-2">Global Signal Monitoring Active</p>
            </div>
          </div>
          <button 
            onClick={fetchRealTimeNews}
            disabled={isLoading}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            Force Sync
          </button>
        </div>

        {isLoading && news.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : error ? (
           <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center">
              <p className="text-red-400 font-black uppercase italic tracking-widest">{error}</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {news.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] hover:border-blue-500/50 transition-all group flex flex-col h-full shadow-xl backdrop-blur-sm"
              >
                <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Hot Signal</span>
                   {item.sourceUrl && (
                     <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-white/20 hover:text-white transition-colors">
                        <ExternalLink size={14} />
                     </a>
                   )}
                </div>
                <h3 className="text-lg font-black text-white uppercase italic leading-tight mb-3 line-clamp-2 tracking-tighter group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs font-bold text-white/40 leading-relaxed mb-6 flex-1 line-clamp-3">
                  {item.summary}
                </p>
                <div className="pt-4 border-t border-white/5 mt-auto">
                   <p className="text-[9px] font-black uppercase tracking-widest text-blue-400/50 mb-2 italic">Suggested Market:</p>
                   <p className="text-sm font-black text-white italic tracking-tight mb-4">
                     "{item.suggestedQuestion}"
                   </p>
                   <button 
                    onClick={() => onCreateMarketFromNews?.(item)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase italic tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                   >
                     <Zap size={14} fill="currentColor" /> Deploy Market
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
           <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-6 py-2 rounded-full">
              <Globe size={14} className="text-blue-500 animate-spin-slow" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Sources: Bloomberg, Reuters, AP, Polymarket Protocol</span>
           </div>
        </div>
      </div>
    </section>
  );
};

export default NewsTerminal;
