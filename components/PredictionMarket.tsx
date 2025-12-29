
import React, { useEffect, useState, useRef } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket } from '../services/marketService';
import { PredictionMerket as MerketType } from '../types';
import { Loader2, X, Twitter, Plus, Image as ImageIcon, Upload, MessageSquare, Gift, Star, ChevronUp, ChevronDown } from 'lucide-react';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const ChanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-white/10"
        />
        {/* Foreground circle arc */}
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-400 transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl font-black leading-none text-white">{percentage}%</span>
        <span className="text-[8px] font-bold uppercase text-white/40 tracking-widest mt-0.5">chance</span>
      </div>
    </div>
  );
};

const CreateMarketModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImage(base64);
                setPreview(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !description.trim()) return;
        setLoading(true);
        try {
            await createMarket({ question, description, image: image || BRAND_LOGO });
            onCreated();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <div className="bg-white w-full max-w-xl rounded-[2rem] border-2 border-white/20 p-8 md:p-10 relative overflow-hidden max-h-[95vh] overflow-y-auto custom-scroll text-blue-900 shadow-2xl">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-blue-100 text-blue-900 rounded-full hover:scale-110 transition-transform"><X size={20} /></button>
                
                <div className="mb-8">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">New Market</h2>
                    <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-1">Deploy terminal signal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Question</label>
                        <input 
                            required
                            type="text" 
                            placeholder="Will $Polymarket reach $10?"
                            className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/20"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Context</label>
                        <textarea 
                            required
                            rows={3}
                            placeholder="Market description..."
                            className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/20 resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Image</label>
                        <div className="grid grid-cols-1 gap-4">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer relative min-h-[120px]"
                            >
                                {preview ? (
                                    <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-80" />
                                ) : (
                                    <>
                                        <Upload className="text-blue-300 mb-2" size={32} />
                                        <p className="text-blue-400 font-bold text-sm uppercase">Upload</p>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center items-center gap-3 shadow-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
                        DEPLOY
                    </button>
                </form>
            </div>
        </div>
    );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const handleTweetAction = () => {
    const slug = slugify(merket.question);
    const domain = window.location.origin;
    const shareLink = `${domain}/${slug}`;
    const tweetText = `Market Signal: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nJoin the terminal:\n${shareLink}\n\n$Polymarket`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#1e293b] w-full max-w-5xl h-[90vh] rounded-[2rem] border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative text-white">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-3 bg-white/10 border border-white/20 rounded-full hover:scale-110 transition-transform"><X size={24} /></button>
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scroll border-r border-white/10">
          <div className="flex items-center gap-6 mb-8">
            <img src={merket.image || BRAND_LOGO} className="w-24 h-24 rounded-2xl border border-white/10 object-cover shadow-xl" />
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">{merket.question}</h2>
          </div>
          <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10">
             <div className="flex justify-between items-end mb-4">
                <span className="text-4xl font-black text-blue-400">{yesProb}% YES</span>
                <span className="text-4xl font-black text-red-400">{100-yesProb}% NO</span>
             </div>
             <div className="h-4 bg-white/10 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: `${yesProb}%` }} />
                <div className="h-full bg-red-500" style={{ width: `${100-yesProb}%` }} />
             </div>
          </div>
          <p className="text-xl font-bold opacity-70 leading-relaxed">"{merket.description}"</p>
        </div>
        <div className="w-full md:w-80 bg-white/5 p-8 flex flex-col justify-center gap-4">
          <button onClick={() => setSelectedOption('YES')} className={`w-full py-4 rounded-xl font-black text-xl border transition-all ${selectedOption === 'YES' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-white/10 hover:border-white/30'}`}>Vote YES</button>
          <button onClick={() => setSelectedOption('NO')} className={`w-full py-4 rounded-xl font-black text-xl border transition-all ${selectedOption === 'NO' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-transparent border-white/10 hover:border-white/30'}`}>Vote NO</button>
          <button onClick={() => onVote(merket.id, selectedOption!)} disabled={!selectedOption || isVoting} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-30 mt-4 shadow-lg">Submit Vote</button>
          <button onClick={handleTweetAction} className="w-full bg-white/10 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 border border-white/10 hover:bg-white/20 transition-all mt-2"><Twitter size={18}/> Share</button>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  
  return (
    <div 
      className="bg-[#1e293b] border border-white/10 rounded-2xl p-5 flex flex-col h-full hover:bg-[#222f44] transition-all cursor-pointer group shadow-xl"
      onClick={() => onOpen(merket)}
    >
      {/* Top Header Section: Question Left, Image Right */}
      <div className="flex justify-between items-start gap-4 mb-4 min-h-[64px]">
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
            {merket.question}
          </h3>
        </div>
        <div className="shrink-0">
          <img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-lg border border-white/10 object-cover" />
        </div>
      </div>

      {/* Stats and Probability Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-2">
          {/* Mock stats to mimic reference image density */}
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
             <span>YES: {yesProb}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
             <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
             <span>NO: {100-yesProb}%</span>
          </div>
        </div>
        <div className="shrink-0">
          <ChanceIndicator percentage={yesProb} />
        </div>
      </div>

      {/* Interactive Buttons (Mimicking Buy but doing Vote) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpen(merket); }}
          className="flex items-center justify-center gap-2 bg-[#2d4a41]/60 hover:bg-[#345b4e] text-[#4ade80] border border-[#3e6b5c] rounded-xl py-3 px-2 font-black text-xs uppercase transition-all shadow-sm"
        >
          Vote Yes <ChevronUp size={14} className="opacity-60" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpen(merket); }}
          className="flex items-center justify-center gap-2 bg-[#4a3434]/60 hover:bg-[#5b3e3e] text-[#fb7185] border border-[#6b3e3e] rounded-xl py-3 px-2 font-black text-xs uppercase transition-all shadow-sm"
        >
          Vote No <ChevronDown size={14} className="opacity-60" />
        </button>
      </div>

      {/* Card Footer */}
      <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase text-white/30 tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><MessageSquare size={12} className="text-white/20" /> {Math.floor(totalVotes / 7)}</span>
          <span className="flex items-center gap-1.5"><Gift size={12} className="text-white/20" /> ${totalVotes}k Vol.</span>
        </div>
        <div className="flex items-center gap-2">
           <Star size={12} className="hover:text-yellow-400 transition-colors cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

const PredictionMerket: React.FC = () => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const refreshMarkets = () => {
      setLoading(true);
      getMerkets().then(data => {
          setMerkets(data);
          setLoading(false);
      });
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

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    setActionLoading(true);
    await voteMerket(id, option);
    const updated = await getMerkets();
    setMerkets(updated);
    setSelectedMerket(updated.find(m => m.id === id)!);
    setActionLoading(false);
  };

  return (
    <section id="merkets">
      <div className="container mx-auto">
        {/* Terminal Filters Section */}
        <div className="flex flex-wrap items-center gap-2 mb-12 pb-5 border-b border-white/5">
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-xs uppercase shadow-lg">Top</button>
                <button className="px-4 py-2 text-white/40 hover:text-white rounded-lg font-black text-xs uppercase transition-colors">New</button>
                <button className="px-4 py-2 text-white/40 hover:text-white rounded-lg font-black text-xs uppercase transition-colors">Trending</button>
            </div>
            <div className="flex items-center gap-2 ml-2 hidden md:flex">
                <button className="px-4 py-2 bg-white/5 text-white/60 hover:text-white border border-white/5 rounded-lg font-black text-xs uppercase transition-colors">Crypto</button>
                <button className="px-4 py-2 bg-white/5 text-white/60 hover:text-white border border-white/5 rounded-lg font-black text-xs uppercase transition-colors">Solana</button>
            </div>
            <div className="ml-auto">
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/10"
                >
                    <Plus size={16} /> New Market
                </button>
            </div>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-400" size={48} />
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.6em]">Syncing Terminal...</span>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {merkets.map(m => (
                <MerketCard 
                    key={m.id} 
                    merket={m} 
                    onOpen={target => { 
                        setSelectedMerket(target); 
                        window.location.hash = `live-market:${slugify(target.question)}`; 
                    }} 
                />
            ))}
          </div>
        )}
      </div>
      
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} />}
      
      {isCreateOpen && <CreateMarketModal onClose={() => setIsCreateOpen(false)} onCreated={refreshMarkets} />}
    </section>
  );
};

export default PredictionMerket;
