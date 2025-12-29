
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, ChevronUp, ChevronDown, Download, Send, TrendingUp } from 'lucide-react';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const XIcon = ({ size = 16, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TrendGraph: React.FC<{ yesProb: number; height?: number }> = ({ yesProb, height = 60 }) => {
  const points = useMemo(() => {
    const p = [];
    const segments = 15;
    const width = 200;
    const baseLine = height / 2;
    const trend = (yesProb - 50) / 50; 

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const jitter = Math.sin(i * 1.8 + yesProb) * 6;
      const trendY = baseLine - (trend * (i / segments) * (height / 2.5)) + jitter;
      p.push(`${x},${Math.max(5, Math.min(height - 5, trendY))}`);
    }
    return p.join(' ');
  }, [yesProb, height]);

  const isBullish = yesProb >= 50;
  const color = isBullish ? '#10b981' : '#f43f5e';

  return (
    <div className="w-full relative overflow-hidden h-[60px] mt-2 mb-4 bg-white/[0.02] rounded-lg border border-white/5">
      <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${yesProb}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.15 }} />
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
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
        />
      </svg>
      <div className="absolute top-1 right-2 flex items-center gap-1">
        <div className={`w-1 h-1 rounded-full animate-pulse`} style={{ backgroundColor: color }}></div>
        <span className="text-[7px] font-black uppercase tracking-tighter opacity-30 text-white">Sentiment Trend</span>
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

  const handleDownloadCard = async () => {
    setIsDownloading(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 1000;

    // Background
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Question Section
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = merket.image || BRAND_LOGO;
    await new Promise(r => logoImg.onload = r);
    ctx.drawImage(logoImg, 60, 60, 120, 120);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 900 64px Space Grotesk';
    ctx.textBaseline = 'top';
    const words = merket.question.toUpperCase().split(' ');
    let line = '';
    let y = 60;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 700 && n > 0) {
        ctx.fillText(line, 210, y);
        line = words[n] + ' ';
        y += 75;
      } else { line = testLine; }
    }
    ctx.fillText(line, 210, y);

    // Sentiment Box
    const boxY = Math.max(250, y + 140);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.roundRect(60, boxY, 880, 420, 50);
    ctx.fill();
    ctx.stroke();

    // Box Header Text
    ctx.font = 'italic 900 20px Space Grotesk';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('BULLISH SENTIMENT', 100, boxY + 40);
    ctx.textAlign = 'right';
    ctx.fillText('BEARISH SENTIMENT', 900, boxY + 40);
    ctx.textAlign = 'left';

    // Box Percentages
    ctx.font = 'italic 900 96px Space Grotesk';
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`${yesProb}% YES`, 100, boxY + 80);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${100-yesProb}% NO`, 900, boxY + 80);
    ctx.textAlign = 'left';

    // Sentiment Bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.roundRect(100, boxY + 200, 800, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.roundRect(100, boxY + 200, (800 * yesProb) / 100, 20, 10);
    ctx.fill();

    // Trend Graph Area
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, boxY + 360);
    for(let i=0; i<=20; i++) {
        const x = 100 + (i * 40);
        const jitter = Math.sin(i * 1.5 + yesProb) * 15;
        const ty = (boxY + 360) - ((yesProb - 50) / 3) + jitter;
        ctx.lineTo(x, ty);
    }
    ctx.stroke();
    ctx.font = 'italic 900 12px Space Grotesk';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'right';
    ctx.fillText('SENTIMENT TREND', 900, boxY + 310);
    ctx.textAlign = 'left';

    // Market Description
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'italic 700 32px Space Grotesk';
    ctx.textAlign = 'center';
    const descText = `"${merket.description}"`;
    const descWords = descText.split(' ');
    let descLine = '';
    let dy = boxY + 480;
    for(let n = 0; n < descWords.length; n++) {
      let testLine = descLine + descWords[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 800 && n > 0) {
        ctx.fillText(descLine, 500, dy);
        descLine = descWords[n] + ' ';
        dy += 45;
      } else { descLine = testLine; }
    }
    ctx.fillText(descLine, 500, dy);

    // Global Feed Footer
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '900 24px Space Grotesk';
    ctx.fillText('GLOBAL FEED', 60, 930);

    const link = document.createElement('a');
    link.download = `market-card-${slugify(merket.question)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsDownloading(false);
  };

  const handleTweetAction = () => {
    const slug = slugify(merket.question);
    const domain = window.location.origin;
    const shareLink = `${domain}/${slug}`;
    const tweetText = `Terminal Analysis: "${merket.question}"\n\nSentiment: ${yesProb}% Bullish\nOn-chain Oracle status: Active\n\nBroadcast signal at:\n${shareLink}\n\n$Polymarket #Solana`;
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
            <div className="mb-8 p-8 bg-white/5 rounded-[2rem] border border-white/5 relative">
               <div className="flex justify-between items-end mb-6 font-black italic uppercase tracking-tighter">
                  <div className="flex flex-col"><span className="text-blue-400 text-[10px] tracking-widest mb-1 opacity-40 italic">Bullish Sentiment</span><span className="text-4xl text-blue-500">{yesProb}% YES</span></div>
                  <div className="flex flex-col items-end"><span className="text-red-400 text-[10px] tracking-widest mb-1 opacity-40 italic">Bearish Sentiment</span><span className="text-4xl text-red-500">{100-yesProb}% NO</span></div>
               </div>
               <div className="h-4 bg-white/5 rounded-full overflow-hidden flex mb-6 border border-white/5">
                  <div className="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${yesProb}%` }} />
                  <div className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)]" style={{ width: `${100-yesProb}%` }} />
               </div>
               <TrendGraph yesProb={yesProb} height={80} />
            </div>
            <p className="text-lg font-bold opacity-60 italic mb-12 px-2 leading-relaxed">"{merket.description}"</p>
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
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={handleTweetAction} className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase italic hover:bg-white/10 transition-all text-white/60">
              <XIcon size={14} /> Share
            </button>
            <button onClick={handleDownloadCard} disabled={isDownloading} className="py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase italic hover:bg-white/10 transition-all text-white/60">
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14}/>} Download Card
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
    <div className="bg-[#1e293b] border border-white/5 rounded-3xl p-6 flex flex-col h-full hover:bg-[#253247] transition-all cursor-pointer group shadow-xl relative overflow-hidden" onClick={() => onOpen(merket)}>
      <div className="flex justify-between items-start gap-4 mb-4 min-h-[64px]">
        <div className="flex-1"><h3 className="text-lg md:text-xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 uppercase italic tracking-tighter">{merket.question}</h3></div>
        <div className="shrink-0"><img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-xl border border-white/10 object-cover shadow-lg" /></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase italic tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span><span>YES: {yesProb}%</span></div>
          <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase italic tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span><span>NO: {100-yesProb}%</span></div>
        </div>
        <div className="shrink-0 scale-90 md:scale-100"><ChanceIndicator percentage={yesProb} /></div>
      </div>
      <TrendGraph yesProb={yesProb} />
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
            reader.onloadend = () => { const base64 = reader.result as string; setImage(base64); setPreview(base64); };
            reader.readAsDataURL(file);
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!question.trim() || !description.trim()) return;
        setLoading(true);
        try { await createMarket({ question, description, image: image || BRAND_LOGO }); onCreated(); onClose(); } 
        catch (err) { console.error(err); } finally { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl text-blue-900">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-blue-100 text-blue-900 rounded-full"><X size={20} /></button>
                <div className="mb-8"><h2 className="text-4xl font-black italic uppercase tracking-tighter">New Market</h2><p className="text-blue-600 font-bold uppercase text-xs tracking-widest italic mt-1">Deploy terminal signal</p></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Question</label><input required type="text" placeholder="Outcome question?" className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10" value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Context</label><textarea required rows={3} placeholder="Provide details..." className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 font-bold text-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-600/10 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 italic tracking-widest">Proof Asset</label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center bg-blue-50/50 hover:bg-blue-100 transition-all cursor-pointer relative min-h-[120px]">{preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80" /> : <Plus size={32} className="text-blue-300" />}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div></div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase italic tracking-tighter shadow-lg">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}</button>
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

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    setActionLoading(true); await voteMerket(id, option);
    const updated = await getMerkets();
    setMerkets(updated);
    setSelectedMerket(updated.find(m => m.id === id)!);
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
      {isCreateOpen && <CreateMarketModal onClose={() => setIsCreateOpen(false)} onCreated={refreshMarkets} />}
    </section>
  );
};
export default PredictionMerket;
