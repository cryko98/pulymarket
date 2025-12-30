
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment, fetchMarketCap } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, ChevronUp, ChevronDown, Send, TrendingUp, BarChart, Zap } from 'lucide-react';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const XIcon = ({ size = 16, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TrendGraph: React.FC<{ yesProb: number; marketId: string; height?: number }> = ({ yesProb, marketId, height = 200 }) => {
  const noProb = 100 - yesProb;
  
  const points = useMemo(() => {
    const yesP = [];
    const noP = [];
    const segments = 60;
    const width = 600;
    
    // Seeded random for consistent "history" per market
    let seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Full 0-100 scale
    const minY = 0;
    const maxY = 100;
    const range = maxY - minY;

    const mapValueToY = (val: number) => {
      // 0 is top, height is bottom
      const normalized = (val - minY) / range;
      return height - (normalized * height);
    };

    // Generate path
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const progress = i / segments;
      
      // History walk that converges on the current real percentage at the end
      // We start from 50 (neutral) and walk towards the target
      const startValueYes = 50;
      const startValueNo = 50;
      
      // Interpolate towards target with some noise
      const baseYes = startValueYes + (yesProb - startValueYes) * progress;
      const baseNo = startValueNo + (noProb - startValueNo) * progress;
      
      const noiseIntensity = (1 - progress) * 12; // More noise in the past
      const currentYes = i === segments ? yesProb : baseYes + (seededRandom() - 0.5) * noiseIntensity;
      const currentNo = i === segments ? noProb : baseNo + (seededRandom() - 0.5) * noiseIntensity;

      yesP.push(`${x},${mapValueToY(currentYes)}`);
      noP.push(`${x},${mapValueToY(currentNo)}`);
    }
    
    return { yes: yesP.join(' '), no: noP.join(' '), mapValueToY };
  }, [yesProb, height, marketId]);

  const labels = [100, 80, 60, 40, 20, 0];

  return (
    <div className="w-full relative flex bg-[#0d1117] rounded-xl border border-white/5 my-6 overflow-hidden shadow-2xl group/graph" style={{ height: `${height}px` }}>
      {/* Graph Area */}
      <div className="flex-1 relative border-r border-white/10 overflow-hidden">
        {/* Horizontal Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
          {labels.map((_, i) => (
            <div key={i} className="w-full border-t border-white/20"></div>
          ))}
        </div>
        
        <svg className="w-full h-full" viewBox={`0 0 600 ${height}`} preserveAspectRatio="none">
          {/* NO Line (Red) */}
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.no}
            className="transition-all duration-700"
          />
          {/* YES Line (Green) */}
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points.yes}
            className="transition-all duration-700"
          />
          
          {/* Real-time Terminal Points */}
          <circle cx="600" cy={points.mapValueToY(yesProb)} r="6" fill="#22c55e" className="transition-all duration-700 shadow-lg" />
          <circle cx="600" cy={points.mapValueToY(noProb)} r="6" fill="#ef4444" className="transition-all duration-700 shadow-lg" />
        </svg>

        {/* Source overlay */}
        <div className="absolute bottom-2 left-3 bg-black/60 px-3 py-1 rounded-md text-[9px] font-black text-white/40 italic uppercase tracking-[0.2em] border border-white/5">
          SOURCE: POLY-MARKET.SITE
        </div>
      </div>

      {/* Right-side Axis Labels */}
      <div className="w-14 flex flex-col justify-between items-center py-0.5 opacity-40 text-[10px] font-black text-white bg-black/40">
        {labels.map((val) => (
          <div key={val} className="flex-1 flex items-center justify-center border-b border-white/5 w-full last:border-b-0 italic">
            {val}%
          </div>
        ))}
      </div>
    </div>
  );
};

const ChanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-white/5" />
        <circle 
          cx="32" cy="32" r={radius} 
          stroke="currentColor" strokeWidth="3.5" fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          className="text-blue-500 transition-all duration-1000" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none translate-y-0.5">
        <span className="text-2xl font-black leading-none text-white tracking-tighter">{percentage}%</span>
        <span className="text-[7px] font-black uppercase text-white/30 tracking-[0.2em] mt-1">Chance</span>
      </div>
    </div>
  );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('poly_username') || '');
  const [mcap, setMcap] = useState<string | null>(null);
  
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (merket.contractAddress) {
      fetchMarketCap(merket.contractAddress).then(setMcap);
    }
  }, [merket.contractAddress]);

  useEffect(() => {
    const fetchComments = async () => {
      const data = await getComments(merket.id);
      setComments(data);
    };
    fetchComments();
    const interval = setInterval(fetchComments, 4000);
    return () => clearInterval(interval);
  }, [merket.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !username.trim()) return;
    localStorage.setItem('poly_username', username);
    await postComment(merket.id, username, newComment);
    setNewComment('');
    const updated = await getComments(merket.id);
    setComments(updated);
  };

  const handleTweetAction = () => {
    const slug = slugify(merket.question);
    const domain = window.location.origin;
    const shareLink = `${domain}/${slug}`;
    const tweetText = `Terminal Analysis: "${merket.question}"\n\nSentiment: ${yesProb}% Bullish\n\nVote on-chain:\n${shareLink}\n\n$Polymarket #Solana`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div className="bg-[#0f172a] w-full max-w-5xl h-[90vh] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl text-white">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-white/5 border border-white/10 rounded-full hover:scale-110 transition-transform"><X size={20} /></button>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8 md:p-12 overflow-y-auto custom-scroll flex-1">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-xl bg-blue-600 p-0.5 shrink-0 border border-white/20 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover rounded-lg" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-[0.9]">{merket.question}</h2>
            </div>

            {mcap && (
              <div className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-2xl w-fit">
                <BarChart size={18} className="text-blue-400" />
                <span className="text-blue-400 font-black uppercase italic tracking-widest text-sm">MCAP: ${mcap}</span>
              </div>
            )}

            <div className="mb-8 p-8 bg-white/5 rounded-[2rem] border border-white/5 relative">
               <div className="flex justify-between items-end mb-6 font-black italic uppercase tracking-tighter">
                  <div className="flex flex-col"><span className="text-green-400 text-[10px] tracking-widest mb-1 opacity-60 italic uppercase font-black">Bullish Signal</span><span className="text-4xl text-green-500">{yesProb}% YES</span></div>
                  <div className="flex flex-col items-end"><span className="text-red-400 text-[10px] tracking-widest mb-1 opacity-60 italic uppercase font-black">Bearish Signal</span><span className="text-4xl text-red-500">{100-yesProb}% NO</span></div>
               </div>
               <div className="h-4 bg-white/5 rounded-full overflow-hidden flex mb-6 border border-white/5">
                  <div className="h-full bg-green-600 transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.4)]" style={{ width: `${yesProb}%` }} />
                  <div className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)]" style={{ width: `${100-yesProb}%` }} />
               </div>
               <TrendGraph yesProb={yesProb} marketId={merket.id} height={250} />
            </div>
            {merket.description && (
              <p className="text-lg font-bold opacity-60 italic mb-12 px-2 leading-relaxed">"{merket.description}"</p>
            )}
            <div className="mt-8 border-t border-white/10 pt-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 flex items-center gap-2 italic">
                <MessageSquare size={14} /> Global Feed
              </h4>
              <div ref={scrollRef} className="space-y-4 max-h-64 overflow-y-auto custom-scroll pr-4 mb-6">
                {comments.length === 0 ? <div className="text-center py-8 opacity-20 italic">Awaiting terminal signals...</div> :
                  comments.map((c) => (
                    <div key={c.id} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{c.username}</span><span className="text-[9px] text-white/20 font-mono italic">{new Date(c.created_at).toLocaleTimeString()}</span></div>
                      <p className="text-sm font-bold text-white/70">{c.content}</p>
                    </div>
                  ))
                }
              </div>
              <form onSubmit={handlePostComment} className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-blue-500/50 transition-colors">
                <input required type="text" placeholder="Alias" className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black text-blue-400 placeholder-white/20 focus:outline-none uppercase" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input required type="text" placeholder="Type message..." className="flex-1 bg-transparent border-none px-3 py-2 text-sm font-bold text-white placeholder-white/10 focus:outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg"><Send size={16} /></button>
              </form>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 bg-white/[0.01] p-8 md:p-12 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-white/10">
          <button onClick={() => setSelectedOption('YES')} className={`w-full py-5 rounded-2xl font-black text-lg border transition-all uppercase italic tracking-tighter ${selectedOption === 'YES' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-white/5 hover:border-white/20 text-white/40'}`}>Yes Signal</button>
          <button onClick={() => setSelectedOption('NO')} className={`w-full py-5 rounded-2xl font-black text-lg border transition-all uppercase italic tracking-tighter ${selectedOption === 'NO' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-transparent border-white/5 hover:border-white/20 text-white/40'}`}>No Signal</button>
          <button onClick={() => onVote(merket.id, selectedOption!)} disabled={!selectedOption || isVoting} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-20 mt-4 shadow-xl uppercase italic tracking-tighter">{isVoting ? <Loader2 className="animate-spin mx-auto" /> : "Submit Vote"}</button>
          <div className="grid grid-cols-1 gap-3 mt-6">
            <button onClick={handleTweetAction} className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase italic hover:bg-white/10 transition-all text-white/60">
              <XIcon size={14} /> Share Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const [mcap, setMcap] = useState<string | null>(null);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  useEffect(() => {
    if (merket.contractAddress) {
      fetchMarketCap(merket.contractAddress).then(setMcap);
    }
  }, [merket.contractAddress]);
  
  return (
    <div className="bg-[#1e293b] border border-white/5 rounded-3xl p-6 flex flex-col h-full hover:bg-[#253247] transition-all cursor-pointer group shadow-xl relative overflow-hidden" onClick={() => onOpen(merket)}>
      <div className="flex justify-between items-start gap-4 mb-4 min-h-[64px]">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 uppercase italic tracking-tighter mb-2">{merket.question}</h3>
          {mcap && (
            <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[9px] uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded w-fit">
              <BarChart size={10} /> MCAP: ${mcap}
            </div>
          )}
        </div>
        <div className="shrink-0"><img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-xl border border-white/10 object-cover shadow-lg" /></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-green-400 uppercase italic tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span><span>YES: {yesProb}%</span></div>
          <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase italic tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span><span>NO: {100-yesProb}%</span></div>
        </div>
        <div className="shrink-0 scale-90 md:scale-100"><ChanceIndicator percentage={yesProb} /></div>
      </div>
      <TrendGraph yesProb={yesProb} marketId={merket.id} height={100} />
      <div className="grid grid-cols-2 gap-3 mb-6 mt-2">
        <button onClick={(e) => { e.stopPropagation(); onOpen(merket); }} className="flex items-center justify-center gap-2 bg-[#2d4a41]/40 hover:bg-[#345b4e]/60 text-[#4ade80] border border-[#3e6b5c] rounded-2xl py-3 px-2 font-black text-[10px] uppercase italic transition-all">Yes <ChevronUp size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); onOpen(merket); }} className="flex items-center justify-center gap-2 bg-[#4a3434]/40 hover:bg-[#5b3e3e]/60 text-[#fb7185] border border-[#6b3e3e] rounded-2xl py-3 px-2 font-black text-[10px] uppercase italic transition-all">No <ChevronDown size={14} /></button>
      </div>
      <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase italic text-white/20 tracking-[0.2em]">
        <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Star size={12} className="text-yellow-500/50" /> {totalVotes} Votes</span></div>
        <div className="flex items-center gap-2"><Plus size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" /></div>
      </div>
    </div>
  );
};

interface CreateMarketModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialQuestion?: string;
  initialDescription?: string;
}

const CreateMarketModal: React.FC<CreateMarketModalProps> = ({ onClose, onCreated, initialQuestion = '', initialDescription = '' }) => {
    const [question, setQuestion] = useState(initialQuestion);
    const [description, setDescription] = useState(initialDescription);
    const [contractAddress, setContractAddress] = useState('');
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { const base64 = reader.result as string; setImage(base64); setPreview(base64); };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!question.trim()) return;
        setLoading(true);
        try { 
          await createMarket({ 
            question, 
            description: description || undefined, 
            contractAddress: contractAddress || undefined, 
            image: image || BRAND_LOGO 
          }); 
          onCreated(); 
          onClose(); 
        } 
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl text-blue-900 max-h-[90vh] overflow-y-auto custom-scroll">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-blue-100 text-blue-900 rounded-full"><X size={20} /></button>
                <div className="mb-8"><h2 className="text-4xl font-black italic uppercase tracking-tighter">New Market</h2><p className="text-blue-600 font-bold uppercase text-xs tracking-widest italic mt-1">Deploy terminal signal</p></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Question (Required)</label><input required type="text" placeholder="Outcome question?" className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10" value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Context (Optional)</label><textarea rows={2} placeholder="Provide details..." className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Solana CA (Optional - Track Market Cap)</label><input type="text" placeholder="Solana Contract Address" className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Proof Asset</label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-100 transition-all cursor-pointer relative min-h-[120px]">{preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80" /> : <Plus size={32} className="text-blue-300" />}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div></div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase italic tracking-tighter shadow-lg">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}</button>
                </form>
            </div>
        </div>
    );
};

interface PredictionMarketProps {
  initialCreateData?: { question: string, description: string } | null;
  onClearInitialData?: () => void;
}

const PredictionMarket: React.FC<PredictionMarketProps> = ({ initialCreateData, onClearInitialData }) => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'top' | 'new' | 'trending'>('top');

  const refreshMarkets = () => {
      setLoading(true);
      getMerkets().then(data => { setMerkets(data); setLoading(false); });
  };

  useEffect(() => {
    getMerkets().then(data => {
      setMerkets(data);
      setLoading(false);
      const hash = window.location.hash;
      if (hash.includes(':')) {
        const slug = hash.split(':')[1];
        const target = data.find(m => slugify(m.question) === slug);
        if (target) setSelectedMerket(target);
      }
    });
  }, []);

  useEffect(() => {
    if (initialCreateData) {
      setIsCreateOpen(true);
    }
  }, [initialCreateData]);

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    setActionLoading(true); await voteMerket(id, option);
    const updated = await getMerkets();
    setMerkets(updated);
    const current = updated.find(m => m.id === id);
    if (current) setSelectedMerket(current);
    setActionLoading(false);
  };

  const sortedMerkets = useMemo(() => {
    const data = [...merkets];
    switch (activeFilter) {
        case 'top': return data.sort((a, b) => (b.yesVotes + b.noVotes) - (a.yesVotes + a.noVotes));
        case 'new': return data.sort((a, b) => b.createdAt - a.createdAt);
        case 'trending': return data.sort((a, b) => {
            const aAct = (a.yesVotes + a.noVotes) * (Date.now() - a.createdAt < 86400000 ? 2 : 1);
            const bAct = (b.yesVotes + b.noVotes) * (Date.now() - b.createdAt < 86400000 ? 2 : 1);
            return bAct - aAct;
        });
        default: return data;
    }
  }, [merkets, activeFilter]);

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    onClearInitialData?.();
  };

  return (
    <section id="merkets">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-12 pb-5 border-b border-white/5">
            <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shadow-lg">
                <button onClick={() => setActiveFilter('top')} className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase italic tracking-widest transition-all ${activeFilter === 'top' ? 'bg-blue-600 text-white shadow-xl' : 'text-white/40 hover:text-white'}`}>Top</button>
                <button onClick={() => setActiveFilter('new')} className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase italic tracking-widest transition-all ${activeFilter === 'new' ? 'bg-blue-600 text-white shadow-xl' : 'text-white/40 hover:text-white'}`}>New</button>
                <button onClick={() => setActiveFilter('trending')} className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase italic tracking-widest transition-all ${activeFilter === 'trending' ? 'bg-blue-600 text-white shadow-xl' : 'text-white/40 hover:text-white'}`}>Trending</button>
            </div>
            <div className="ml-auto">
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase italic tracking-tighter hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/20">
                    <Plus size={18} /> New Market
                </button>
            </div>
        </div>
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={56} />
                <span className="font-black text-[10px] text-white/30 uppercase tracking-[0.8em] italic">Syncing Terminal...</span>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedMerkets.map(m => <MerketCard key={m.id} merket={m} onOpen={target => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />)}
          </div>
        )}
      </div>
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} />}
      {isCreateOpen && (
        <CreateMarketModal 
          onClose={handleCloseCreate} 
          onCreated={refreshMarkets} 
          initialQuestion={initialCreateData?.question}
          initialDescription={initialCreateData?.description}
        />
      )}
    </section>
  );
};
export default PredictionMarket;
