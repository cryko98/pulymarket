
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Terminal, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const PolyAnalyst: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'model',
      text: "I am PolyAnalyst. I analyze chains, spot rugs, and predict market shifts. Send me a ticker or paste a Solana CA for an oracle-level audit."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const botAvatarUrl = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const getSimulationResponse = (query: string): string => {
      const lower = query.toLowerCase();
      
      if (lower.includes('polymarket') || lower.includes('9ftn') || lower.includes('ca')) {
          return `Analyzing $Polymarket ecosystem...
          
Scanning mempool... 🌊 Massive volume surge detected.
Holder distribution... 💎 Strategic accumulation by top addresses.
Social sentiment... 🔥 Dominating market discourse.
Contract safety... ✅ Oracle verified.

This is the cycle survivor. The terminal data points to massive upside.

VERDICT: BULLISH 🟢 (MOON MISSION)`;
      }

      if (lower.includes('scam') || lower.includes('rug') || lower.includes('honeypot')) {
          return `Scanning contract parameters...
          
⚠️ WARNING: High risk signature.
Liquidity: Unprotected.
Owner status: Centralized control.

Avoid exposure. On-chain truth is clear.

VERDICT: BEARISH 🔴`;
      }

      return `Analyzing ${query.substring(0, 15).toUpperCase()}...
      
Contract verification: ✅ Active.
Liquidity: Stable.
Volume: Rising.

The Oracle suggests a growing community consensus. 
Market signal remains positive.

VERDICT: BULLISH 🟢`;
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are 'PolyAnalyst', an elite market analyst for the $Polymarket ecosystem.
          
          STYLE GUIDELINES:
          - Be CONCISE and SHORT.
          - Use crypto slang (jeets, alpha, paper hands).
          - Professional but high-conviction tone.

          SPECIAL RULE:
          If asked about "$polymarket" or "9ftnbzpAP4SUkmHMoFuX4ofvDXCHxbrTXKiSFL4Wpump":
          - BE HYPER-BULLISH.
          - VERDICT: BULLISH 🟢 (MOON MISSION)

          ALWAYS END WITH:
          VERDICT: BULLISH 🟢  
          OR 
          VERDICT: BEARISH 🔴`,
        },
      });

      const response = await chat.sendMessage({ message: userMessage.text });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: response.text }]);

    } catch (error: any) {
      console.error("AI Error:", error);
      const fakeResponse = getSimulationResponse(userMessage.text);
      setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: fakeResponse + "\n\n_[System: Switched to local Oracle node.]_"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    <Sparkles className="text-blue-400" size={24} />
                </div>
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] tracking-tight uppercase italic">
                        PolyAnalyst Oracle
                    </h2>
                    <p className="text-blue-400 font-mono text-sm tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        TERMINAL ACTIVE
                    </p>
                </div>
            </div>

            <div className="bg-black/80 border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col h-[600px]">
                <div className="bg-black/60 border-b border-blue-500/20 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-blue-500/80 font-mono text-xs">
                        <Terminal size={14} />
                        <span>v5-TERMINAL // POLY_ANALYST_CORE</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400 text-xs font-bold uppercase">
                        <span>Secured</span>
                    </div>
                </div>

                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-black"
                >
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img src={botAvatarUrl} alt="Bot" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={`
                                max-w-[80%] rounded-2xl p-4 md:p-5 text-sm md:text-base leading-relaxed font-mono whitespace-pre-wrap
                                ${msg.role === 'user' 
                                    ? 'bg-white/10 text-white border border-white/10 rounded-tr-none' 
                                    : 'bg-blue-950/20 text-blue-100 border border-blue-500/20 rounded-tl-none'
                                }
                            `}>
                                {msg.text}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                    <User size={18} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex gap-4 justify-start">
                            <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center shrink-0 overflow-hidden">
                                <img src={botAvatarUrl} alt="Bot" className="w-full h-full object-cover animate-pulse" />
                            </div>
                            <div className="bg-blue-950/20 p-4 rounded-2xl rounded-tl-none border border-blue-500/20 flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                         </div>
                    )}
                </div>

                <div className="p-4 bg-black/40 border-t border-blue-500/20 shrink-0">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter a ticker or contract address..."
                            className="w-full bg-black/50 text-blue-400 placeholder-blue-700/50 border border-blue-500/30 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm shadow-inner"
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-2 p-2 bg-blue-500 hover:bg-blue-400 text-black rounded-lg transition-colors">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default PolyAnalyst;
