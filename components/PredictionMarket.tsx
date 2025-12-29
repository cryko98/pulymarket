
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Loader2, X, Twitter, Plus, Image as ImageIcon, Upload, MessageSquare, Gift, Star, ChevronUp, ChevronDown, Download, Send, User, TrendingUp } from 'lucide-react';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const TrendGraph: React.FC<{ yesProb: number; height?: number }> = ({ yesProb, height = 60 }) => {
  // Generate a path that reflects the current sentiment
  // If yesProb > 50, trend up. If < 50, trend down.
  const points = useMemo(() => {
    const p = [];
    const segments = 12;
    const width = 200;
    const baseLine = height / 2;
    const trend = (yesProb - 50) / 50; // -1 to 1

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      // Add some deterministic randomness based on yesProb to make it look "live" but stable
      const jitter = Math.sin(i * 1.5 + yesProb) * 5;
      const trendY = baseLine - (trend * (i / segments) * (height / 2.5)) + jitter;
      p.push(`${x},${Math.max(5, Math.min(height - 5, trendY))}`);
    }
    return p.join(' ');
  }, [yesProb, height]);

  const isBullish = yesProb >= 50;
  const color = isBullish ? '#10b981' : '#f43f5e';

  return (
    <div className="w-full relative overflow-hidden h-[60px] mt-2 mb-4">
      <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${yesProb}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path
          d={`M0,60 L0,30 ${points.split(' ').map((p, i) => (i === 0 ? `L${p}` : `L${p}`)).join(' ')} L200,60 Z`}
          fill={`url(#grad-${yesProb})`}
          className="transition-all duration-1000"
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
      </svg>
      <div className="absolute top-0 right-0 flex items-center gap-1">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: color }}></div>
        <span className="text-[8px] font-black uppercase tracking-tighter opacity-40">Live Feed</span>
      </div>
    </div>
  );
};

const ChanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-blue-400 transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl font-black leading-none text-white">{percentage}%</span>
        <span className="text-[8px] font-bold uppercase text-white/40 tracking-widest mt-0.5">chance</span>
      </div>
    </div>
  );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('poly_username') || '');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      const data = await getComments(merket.id);
      setComments(data);
    };
    fetchComments();
    const interval = setInterval(fetchComments, 5000);
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

  const handleDownloadCard = async () => {
    setIsDownloading(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 630;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Brand Logo
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = BRAND_LOGO;
    await new Promise(r => logo.onload = r);
    ctx.drawImage(logo, 50, 50, 80, 80);

    // Text Content
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px Space Grotesk';
    ctx.fillText('POLYMARKET TERMINAL', 150, 110);

    ctx.font = 'italic 900 72px Space Grotesk';
    const words = merket.question.toUpperCase().split(' ');
    let line = '';
    let y = 250;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 1100 && n > 0) {
        ctx.fillText(line, 50, y);
        line = words[n] + ' ';
        y += 80;
      } else { line = testLine; }
    }
    ctx.fillText(line, 50, y);

    // Probabilities
    y += 100;
    ctx.fillStyle = '#2563eb';
    ctx.font = '900 120px Space Grotesk';
    ctx.fillText(`${yesProb}% YES`, 50, y);

    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'right';
    ctx.fillText(`${100-yesProb}% NO`, 1150, y);

    // Progress Bar
    y += 40;
    ctx.fillStyle = '#1e293b';
    ctx.roundRect(50, y, 1100, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#2563eb';
    ctx.roundRect(50, y, (1100 * yesProb) / 100, 40, 20);
    ctx.fill();

    // Trigger download
    const link = document.createElement('a');
    link.download = `market-${merket.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsDownloading(false);
  };

  const handleTweetAction = () => {
    const slug = slugify(merket.question);
    const domain = window.location.origin;
    const shareLink = `${domain}/${slug}`;
    const tweetText = `Terminal Signal: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nJoin the oracle:\n${shareLink}\n\n$Polymarket`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="bg-[#111827] w-full max-w-5xl h-[90vh] rounded-[2rem] border-2 border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl relative text-white">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-white/5 border border-white/10 rounded-full hover:scale-110 transition-transform"><X size={20} /></button>
        
        {/* Left Side: Info & Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8 md:p-12 overflow-y-auto custom-scroll flex-1">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 p-1 border-2 border-white/10 shrink-0">
                <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover rounded-xl" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-[0.9]">{merket.question}</h2>
            </div>

            {/* Sentiment Gauge Box */}
            <div className="mb-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
               <div className="flex justify-between items-end mb-6 font-black italic">
                  <div className="flex flex-col">
                    <span className="text-blue-400 text-sm uppercase tracking-widest mb-1 opacity-60">Bullish</span>
                    <span className="text-4xl text-blue-500">{yesProb}% YES</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-red-400 text-sm uppercase tracking-widest mb-1 opacity-60">Bearish</span>
                    <span className="text-4xl text-red-500">{100-yesProb}% NO</span>
                  </div>
               </div>
               <div className="h-4 bg-white/10 rounded-full overflow-hidden flex border border-white/5 mb-4">
                  <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.5)]" style={{ width: `${yesProb}%` }} />
                  <div className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.5)]" style={{ width: `${100-yesProb}%` }} />
               </div>
               <TrendGraph yesProb={yesProb} height={80} />
            </div>

            <p className="text-lg font-bold opacity-70 italic mb-12 px-2">"{merket.description}"</p>

            {/* Chat Section */}
            <div className="mt-8 border-t border-white/10 pt-8">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-6 flex items-center gap-2">
                <MessageSquare size={14} /> LIVE TERMINAL FEED
              </h4>
              <div ref={scrollRef} className="space-y-4 max-h-60 overflow-y-auto custom-scroll pr-4 mb-6">
                {comments.length === 0 ? (
                  <div className="text-center py-8 opacity-20 italic">No incoming signals...</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{c.username}</span>
                        <span className="text-[10px] text-white/20 font-mono">{new Date(c.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-medium text-white/80">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={handlePostComment} className="flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/10">
                <input 
                  required
                  type="text"
                  placeholder="Username"
                  className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-blue-400 placeholder-white/20 focus:outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input 
                  required
                  type="text"
                  placeholder="Send a signal..."
                  className="flex-1 bg-transparent border-none px-3 py-2 text-sm font-bold text-white placeholder-white/20 focus:outline-none"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="w-full md:w-80 bg-white/[0.02] p-8 md:p-12 flex flex-col justify-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-white/10">
          <button 
            onClick={() => setSelectedOption('YES')} 
            className={`w-full py-5 rounded-2xl font-black text-lg border transition-all ${selectedOption === 'YES' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-white/10 hover:border-white/30 text-white/60'}`}
          >
            VOTE YES
          </button>
          <button 
            onClick={() => setSelectedOption('NO')} 
            className={`w-full py-5 rounded-2xl font-black text-lg border transition-all ${selectedOption === 'NO' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-transparent border-white/10 hover:border-white/30 text-white/60'}`}
          >
            VOTE NO
          </button>
          <button 
            onClick={() => onVote(merket.id, selectedOption!)} 
            disabled={!selectedOption || isVoting} 
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-30 mt-4 shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {isVoting ? <Loader2 className="animate-spin" /> : "SUBMIT VOTE"}
          </button>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={handleTweetAction} className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase hover:bg-white/10 transition-all">
              <Twitter size={14}/> Share
            </button>
            <button 
              onClick={handleDownloadCard} 
              disabled={isDownloading}
              className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase hover:bg-white/10 transition-all"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14}/>} 
              Download
            </button>
          </div>
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
      <div className="flex justify-between items-start gap-4 mb-4 min-h-[64px]">
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 uppercase italic tracking-tighter">
            {merket.question}
          </h3>
        </div>
        <div className="shrink-0">
          <img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-lg border border-white/10 object-cover" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
             <span>YES: {yesProb}%</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 uppercase">
             <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
             <span>NO: {100-yesProb}%</span>
          </div>
        </div>
        <div className="shrink-0 scale-75 md:scale-100">
          <ChanceIndicator percentage={yesProb} />
        </div>
      </div>

      {/* Real-time Sentiment Graph */}
      <TrendGraph yesProb={yesProb} />

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
                        <input required type="text" placeholder="Will $Polymarket reach $10?" className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/20" value={question} onChange={(e) => setQuestion(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Context</label>
                        <textarea required rows={3} placeholder="Market description..." className="w-full bg-blue-50 border-2 border-blue-100 rounded-xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/20 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-500 mb-2 ml-1">Image</label>
                        <div className="grid grid-cols-1 gap-4">
                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer relative min-h-[120px]">
                                {preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-80" /> : (
                                    <>
                                        <Upload className="text-blue-300 mb-2" size={32} />
                                        <p className="text-blue-400 font-bold text-sm uppercase">Upload</p>
                                    </>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center items-center gap-3 shadow-lg">
                        {loading ? <Loader2 className="animate-spin" /> : <Plus size={24} />} DEPLOY
                    </button>
                </form>
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
        <div className="flex flex-wrap items-center gap-2 mb-12 pb-5 border-b border-white/5">
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black text-xs uppercase shadow-lg">Top</button>
                <button className="px-4 py-2 text-white/40 hover:text-white rounded-lg font-black text-xs uppercase transition-colors">New</button>
                <button className="px-4 py-2 text-white/40 hover:text-white rounded-lg font-black text-xs uppercase transition-colors">Trending</button>
            </div>
            <div className="ml-auto">
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/10">
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
            {merkets.map(m => <MerketCard key={m.id} merket={m} onOpen={target => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />)}
          </div>
        )}
      </div>
      
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} />}
      {isCreateOpen && <CreateMarketModal onClose={() => setIsCreateOpen(false)} onCreated={refreshMarkets} />}
    </section>
  );
};

export default PredictionMerket;
