
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment, fetchMarketCap } from '../services/marketService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, ChevronUp, ChevronDown, Send, TrendingUp, BarChart, Zap, WifiOff } from 'lucide-react';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const TrendGraph: React.FC<{ yesProb: number; marketId: string; height?: number }> = ({ yesProb, marketId, height = 200 }) => {
  const noProb = 100 - yesProb;
  const points = useMemo(() => {
    const yesP = []; const noP = []; const segments = 40; const width = 600;
    let seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const mapValueToY = (val: number) => height - ((val / 100) * height);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const progress = i / segments;
      const currentYes = i === segments ? yesProb : 50 + (yesProb - 50) * progress + (seededRandom() - 0.5) * (1 - progress) * 15;
      const currentNo = i === segments ? noProb : 50 + (noProb - 50) * progress + (seededRandom() - 0.5) * (1 - progress) * 15;
      yesP.push(`${x},${mapValueToY(currentYes)}`);
      noP.push(`${x},${mapValueToY(currentNo)}`);
    }
    return { yes: yesP.join(' '), no: noP.join(' '), mapValueToY };
  }, [yesProb, height, marketId]);

  return (
    <div className="w-full relative flex bg-[#0d1117] rounded-xl border border-white/5 my-4 overflow-hidden" style={{ height: `${height}px` }}>
      <div className="flex-1 relative border-r border-white/10">
        <svg className="w-full h-full" viewBox={`0 0 600 ${height}`} preserveAspectRatio="none">
          <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={points.no} className="opacity-40" />
          <polyline fill="none" stroke="#22c55e" strokeWidth="3" points={points.yes} />
        </svg>
      </div>
    </div>
  );
};

const ChanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 24; const circumference = 2 * Math.PI * radius; const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-blue-500 transition-all duration-700" />
      </svg>
      <span className="absolute text-xs font-black text-white">{percentage}%</span>
    </div>
  );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('poly_username') || '');
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(getUserVote(merket.id));
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  useEffect(() => {
    getComments(merket.id).then(setComments);
  }, [merket.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newComment.trim() || !username.trim()) return;
    localStorage.setItem('poly_username', username);
    await postComment(merket.id, username, newComment);
    setNewComment('');
    getComments(merket.id).then(setComments);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-2">
      <div className="bg-[#0f172a] w-full max-w-4xl h-[90vh] rounded-3xl border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full"><X size={18} /></button>
        <div className="flex-1 overflow-y-auto custom-scroll p-6 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <img src={merket.image || BRAND_LOGO} className="w-16 h-16 rounded-xl object-cover" />
            <h2 className="text-2xl md:text-4xl font-black uppercase italic italic">{merket.question}</h2>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-8">
            <div className="flex justify-between items-end mb-4 font-black uppercase">
              <span className="text-green-500 text-3xl">{yesProb}% YES</span>
              <span className="text-red-500 text-3xl">{100-yesProb}% NO</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden flex mb-4">
              <div className="h-full bg-green-600 transition-all duration-1000" style={{ width: `${yesProb}%` }} />
              <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${100-yesProb}%` }} />
            </div>
            <TrendGraph yesProb={yesProb} marketId={merket.id} height={150} />
          </div>
          <p className="text-white/60 font-bold mb-8 italic">"{merket.description}"</p>
          <div className="border-t border-white/10 pt-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4">Live Signals</h4>
            <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
              {comments.map(c => (
                <div key={c.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-black text-blue-400 uppercase">{c.username}</span>
                  <p className="text-sm font-bold text-white/70">{c.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handlePostComment} className="flex gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
              <input required type="text" placeholder="Alias" className="w-20 bg-white/5 rounded-lg px-2 py-1 text-xs font-black text-blue-400 uppercase focus:outline-none" value={username} onChange={e => setUsername(e.target.value)} />
              <input required type="text" placeholder="Type..." className="flex-1 bg-transparent px-2 text-sm font-bold text-white focus:outline-none" value={newComment} onChange={e => setNewComment(e.target.value)} />
              <button type="submit" className="p-2 bg-blue-600 rounded-lg text-white"><Send size={14} /></button>
            </form>
          </div>
        </div>
        <div className="w-full md:w-72 bg-white/[0.02] p-8 border-t md:border-t-0 md:border-l border-white/10 flex flex-col gap-3">
          <button onClick={() => setSelectedOption('YES')} className={`w-full py-4 rounded-xl font-black text-lg border transition-all uppercase ${selectedOption === 'YES' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/5 text-white/40'}`}>Yes Signal</button>
          <button onClick={() => setSelectedOption('NO')} className={`w-full py-4 rounded-xl font-black text-lg border transition-all uppercase ${selectedOption === 'NO' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-white/5 text-white/40'}`}>No Signal</button>
          <button onClick={() => onVote(merket.id, selectedOption!)} disabled={!selectedOption || isVoting} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-20 uppercase mt-auto">{isVoting ? <Loader2 className="animate-spin mx-auto" /> : "Submit Vote"}</button>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void; onDirectVote: (id: string, option: 'YES' | 'NO') => void }> = ({ merket, onOpen, onDirectVote }) => {
  const [mcap, setMcap] = useState<string | null>(null);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  const currentVote = getUserVote(merket.id);

  useEffect(() => { if (merket.contractAddress) fetchMarketCap(merket.contractAddress).then(setMcap); }, [merket.contractAddress]);

  return (
    <div className="bg-[#1e293b] border border-white/5 rounded-3xl p-6 flex flex-col h-full hover:border-blue-500/30 transition-all shadow-xl group cursor-pointer" onClick={() => onOpen(merket)}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-black text-white leading-tight uppercase italic group-hover:text-blue-400 transition-colors line-clamp-2">{merket.question}</h3>
          {mcap && <div className="text-[10px] text-blue-400 font-mono mt-2 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded w-fit">MCAP: ${mcap}</div>}
        </div>
        <img src={merket.image || BRAND_LOGO} className="w-12 h-12 rounded-xl border border-white/10 object-cover" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> YES: {yesProb}%</div>
          <div className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> NO: {100-yesProb}%</div>
        </div>
        <ChanceIndicator percentage={yesProb} />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button 
          onClick={(e) => { e.stopPropagation(); onDirectVote(merket.id, 'YES'); }} 
          className={`flex items-center justify-center gap-2 border rounded-2xl py-3 font-black text-xs uppercase italic transition-all ${currentVote === 'YES' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-green-500/5 border-green-500/20 text-green-500/60 hover:bg-green-500/10'}`}
        >Yes <ChevronUp size={14} /></button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDirectVote(merket.id, 'NO'); }} 
          className={`flex items-center justify-center gap-2 border rounded-2xl py-3 font-black text-xs uppercase italic transition-all ${currentVote === 'NO' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-red-500/5 border-red-500/20 text-red-500/60 hover:bg-red-500/10'}`}
        >No <ChevronDown size={14} /></button>
      </div>
      <div className="mt-auto pt-4 border-t border-white/5 text-[10px] font-black uppercase text-white/20 tracking-widest flex justify-between">
        <span><Star size={10} className="inline mr-1" /> {totalVotes} Votes</span>
        <Plus size={14} className="opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
};

// Props interface for CreateMarketModal to allow pre-filling
const CreateMarketModal: React.FC<{ onClose: () => void; onCreated: () => void; initialData?: { question: string, description: string } | null }> = ({ onClose, onCreated, initialData }) => {
    const [question, setQuestion] = useState(initialData?.question || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [contractAddress, setContractAddress] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Update local state if initialData changes
    useEffect(() => {
      if (initialData) {
        setQuestion(initialData.question);
        setDescription(initialData.description);
      }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!question.trim()) return;
        setLoading(true);
        try { await createMarket({ question, description, contractAddress, image: image || BRAND_LOGO }); onCreated(); onClose(); } 
        catch (err) { } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 relative shadow-2xl text-blue-900">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-blue-100 rounded-full"><X size={18} /></button>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6">New Market</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required type="text" placeholder="Question?" className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 text-blue-900 font-bold focus:outline-none" value={question} onChange={e => setQuestion(e.target.value)} />
                    <textarea placeholder="Details..." className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 text-blue-900 font-bold focus:outline-none h-24" value={description} onChange={e => setDescription(e.target.value)} />
                    <input type="text" placeholder="Solana CA (Optional)" className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 text-blue-900 font-bold focus:outline-none" value={contractAddress} onChange={e => setContractAddress(e.target.value)} />
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl text-xl hover:bg-blue-700 disabled:opacity-50 uppercase shadow-lg">
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Define props interface for PredictionMarket to fix the type error in index.tsx
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
  const [activeFilter, setActiveFilter] = useState<'top' | 'new'>('top');

  const refreshMarkets = async () => {
    const data = await getMerkets();
    setMerkets(data);
    setLoading(false);
  };

  useEffect(() => { refreshMarkets(); }, []);

  // Effect to handle external pre-fill requests
  useEffect(() => {
    if (initialCreateData) {
      setIsCreateOpen(true);
    }
  }, [initialCreateData]);

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    if (onClearInitialData) onClearInitialData();
  };

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    setActionLoading(true);
    try {
      // Optimista frissítés lokálisan a listában
      setMerkets(prev => prev.map(m => {
        if (m.id !== id) return m;
        const prevVote = getUserVote(id);
        let nY = m.yesVotes; let nN = m.noVotes;
        if (prevVote === 'YES') nY = Math.max(0, nY - 1);
        if (prevVote === 'NO') nN = Math.max(0, nN - 1);
        if (option === 'YES') nY += 1;
        if (option === 'NO') nN += 1;
        return { ...m, yesVotes: nY, noVotes: nN };
      }));
      
      await voteMerket(id, option);
      // Szinkronizáció a szerverrel
      await refreshMarkets();
      
      // Ha a modal nyitva van, frissítsük a benne lévő adatot is
      if (selectedMerket && selectedMerket.id === id) {
        const updated = await getMerkets();
        const current = updated.find(m => m.id === id);
        if (current) setSelectedMerket(current);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const sortedMerkets = useMemo(() => {
    return [...merkets].sort((a, b) => activeFilter === 'top' ? (b.yesVotes + b.noVotes) - (a.yesVotes + a.noVotes) : b.createdAt - a.createdAt);
  }, [merkets, activeFilter]);

  return (
    <section className="pb-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-10 pb-6 border-b border-white/5">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
                <button onClick={() => setActiveFilter('top')} className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs uppercase italic transition-all ${activeFilter === 'top' ? 'bg-blue-600 text-white' : 'text-white/40'}`}>Top</button>
                <button onClick={() => setActiveFilter('new')} className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black text-xs uppercase italic transition-all ${activeFilter === 'new' ? 'bg-blue-600 text-white' : 'text-white/40'}`}>New</button>
            </div>
            <button onClick={() => setIsCreateOpen(true)} className="w-full md:w-auto md:ml-auto px-8 py-3 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase italic hover:bg-blue-600 shadow-xl border border-blue-400/20 flex items-center justify-center gap-2"><Plus size={16} /> New Market</button>
        </div>
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
                <span className="font-black text-[10px] text-white/30 uppercase tracking-[0.5em] italic">Syncing Terminal...</span>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedMerkets.map(m => <MerketCard key={m.id} merket={m} onOpen={setSelectedMerket} onDirectVote={handleVote} />)}
          </div>
        )}
      </div>
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => setSelectedMerket(null)} onVote={handleVote} isVoting={actionLoading} />}
      {isCreateOpen && <CreateMarketModal onClose={handleCloseCreate} onCreated={refreshMarkets} initialData={initialCreateData} />}
    </section>
  );
};
export default PredictionMarket;
