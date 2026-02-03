
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment, fetchMarketCap } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, ChevronUp, ChevronDown, Send, BarChart } from 'lucide-react';

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
    
    let seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const minY = 0;
    const maxY = 100;
    const range = maxY - minY;

    const mapValueToY = (val: number) => {
      const normalized = (val - minY) / range;
      return height - (normalized * height);
    };

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const progress = i / segments;
      
      const startValueYes = 50;
      const startValueNo = 50;
      
      const baseYes = startValueYes + (yesProb - startValueYes) * progress;
      const baseNo = startValueNo + (noProb - startValueNo) * progress;
      
      const noiseIntensity = (1 - progress) * 12;
      const currentYes = i === segments ? yesProb : baseYes + (seededRandom() - 0.5) * noiseIntensity;
      const currentNo = i === segments ? noProb : baseNo + (seededRandom() - 0.5) * noiseIntensity;

      yesP.push(`${x},${mapValueToY(currentYes)}`);
      noP.push(`${x},${mapValueToY(currentNo)}`);
    }
    
    return { yes: yesP.join(' '), no: noP.join(' '), mapValueToY };
  }, [yesProb, height, marketId]);

  const labels = [100, 80, 60, 40, 20, 0];

  return (
    <div className="w-full relative flex bg-slate-950 rounded-xl border border-slate-800 my-6 overflow-hidden shadow-2xl group/graph" style={{ height: `${height}px` }}>
      <div className="flex-1 relative border-r border-slate-800 overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {labels.map((_, i) => (
            <div key={i} className="w-full border-t border-slate-800"></div>
          ))}
        </div>
        
        <svg className="w-full h-full" viewBox={`0 0 600 ${height}`} preserveAspectRatio="none">
          <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points.no} className="transition-all duration-700" />
          <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points.yes} className="transition-all duration-700" />
          <circle cx="600" cy={points.mapValueToY(yesProb)} r="6" fill="#22c55e" className="transition-all duration-700 shadow-lg" />
          <circle cx="600" cy={points.mapValueToY(noProb)} r="6" fill="#ef4444" className="transition-all duration-700 shadow-lg" />
        </svg>

        <div className="absolute bottom-2 left-3 bg-black/60 px-3 py-1 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700">
          SOURCE: POLY-MARKET.SITE
        </div>
      </div>

      <div className="w-10 md:w-14 flex flex-col justify-between items-center py-0.5 text-[9px] md:text-[10px] font-bold text-slate-500 bg-black/40">
        {labels.map((val) => (
          <div key={val} className="flex-1 flex items-center justify-center border-b border-slate-800 w-full last:border-b-0">
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
    <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-slate-700" />
        <circle 
          cx="32" cy="32" r={radius} 
          stroke="currentColor" strokeWidth="3.5" fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          className="text-blue-500 transition-all duration-1000" 
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xl md:text-2xl font-bold leading-none text-slate-100 tracking-tight">{percentage}%</span>
        <span className="text-[7px] font-bold uppercase text-slate-400 tracking-widest mt-1">Chance</span>
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

  const labelA = merket.optionA || 'YES';
  const labelB = merket.optionB || 'NO';

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
    const shareLink = `${domain}/#live-market:${slug}`;
    const tweetText = `Terminal Analysis: "${merket.question}"\n\n${labelA}: ${yesProb}%\n${labelB}: ${100-yesProb}%\n\nVote on-chain:\n${shareLink}\n\n$Polymarket #Solana`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md md:p-4">
      <div className="bg-slate-900 w-full md:max-w-5xl h-[100dvh] md:h-[90vh] md:max-h-[800px] rounded-none md:rounded-3xl border-t md:border border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-2xl text-white relative">
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-2 bg-slate-800 border border-slate-700 rounded-full hover:scale-110 transition-transform"><X size={20} /></button>
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-5 md:p-12 overflow-y-auto custom-scroll flex-1">
            <div className="flex items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8 pr-10">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-blue-600 p-0.5 shrink-0 border border-slate-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover rounded-lg" />
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight break-words">{merket.question}</h2>
            </div>

            {mcap && (
              <div className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 px-4 py-2 md:px-6 md:py-3 rounded-2xl w-fit">
                <BarChart size={16} className="text-blue-400 md:w-[18px] md:h-[18px]" />
                <span className="text-blue-400 font-bold uppercase tracking-widest text-xs md:text-sm">MCAP: ${mcap}</span>
              </div>
            )}

            <div className="mb-6 md:mb-8 p-4 md:p-8 bg-slate-950/50 rounded-3xl border border-slate-800 relative">
               <div className="flex justify-between items-end mb-4 md:mb-6 font-bold tracking-tight">
                  <div className="flex flex-col"><span className="text-green-400 text-[10px] tracking-widest mb-1 opacity-70 font-bold uppercase">{labelA} Signal</span><span className="text-2xl md:text-4xl text-green-500">{yesProb}% {labelA}</span></div>
                  <div className="flex flex-col items-end"><span className="text-red-400 text-[10px] tracking-widest mb-1 opacity-70 font-bold uppercase">{labelB} Signal</span><span className="text-2xl md:text-4xl text-red-500">{100-yesProb}% {labelB}</span></div>
               </div>
               <div className="h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden flex mb-4 md:mb-6 border border-slate-700">
                  <div className="h-full bg-green-600 transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.4)]" style={{ width: `${yesProb}%` }} />
                  <div className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)]" style={{ width: `${100-yesProb}%` }} />
               </div>
               <TrendGraph yesProb={yesProb} marketId={merket.id} height={200} />
            </div>
            {merket.description && (
              <p className="text-sm md:text-lg font-medium text-slate-400 mb-8 md:mb-12 px-2 leading-relaxed">"{merket.description}"</p>
            )}
            <div className="mt-8 border-t border-slate-800 pt-6 md:pt-8 pb-20 md:pb-0">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 md:mb-6 flex items-center gap-2">
                <MessageSquare size={14} /> Global Feed
              </h4>
              <div ref={scrollRef} className="space-y-3 md:space-y-4 max-h-48 md:max-h-64 overflow-y-auto custom-scroll pr-2 md:pr-4 mb-4 md:mb-6">
                {comments.length === 0 ? <div className="text-center py-8 text-slate-600 font-medium">Awaiting terminal signals...</div> :
                  comments.map((c) => (
                    <div key={c.id} className="bg-slate-950 rounded-2xl p-3 md:p-4 border border-slate-800">
                      <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{c.username}</span><span className="text-[9px] text-slate-600 font-mono">{new Date(c.created_at).toLocaleTimeString()}</span></div>
                      <p className="text-xs md:text-sm font-medium text-slate-300">{c.content}</p>
                    </div>
                  ))
                }
              </div>
              <form onSubmit={handlePostComment} className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-700 focus-within:border-blue-500 transition-colors">
                <input required type="text" placeholder="Alias" className="w-20 md:w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold text-blue-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input required type="text" placeholder="Type message..." className="flex-1 bg-transparent border-none px-2 md:px-3 py-2 text-xs md:text-sm font-medium text-white placeholder-slate-500 focus:outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="p-2 md:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg"><Send size={14} className="md:w-4 md:h-4" /></button>
              </form>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 bg-slate-950 p-5 md:p-12 flex flex-col justify-center gap-3 md:gap-4 border-t border-slate-700 md:border-t-0 md:border-l z-10 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none pb-8 md:pb-12">
          <div className="flex md:flex-col gap-3">
             <button onClick={() => setSelectedOption('YES')} className={`flex-1 md:w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-lg border-2 transition-all uppercase tracking-wider ${selectedOption === 'YES' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{labelA}</button>
             <button onClick={() => setSelectedOption('NO')} className={`flex-1 md:w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-lg border-2 transition-all uppercase tracking-wider ${selectedOption === 'NO' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{labelB}</button>
          </div>
          <button onClick={() => onVote(merket.id, selectedOption!)} disabled={!selectedOption || isVoting} className="w-full bg-blue-600 text-white font-bold py-4 md:py-5 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2 md:mt-4 shadow-xl uppercase tracking-wider text-sm md:text-base">{isVoting ? <Loader2 className="animate-spin mx-auto" /> : "Submit Vote"}</button>
          <div className="grid grid-cols-1 gap-3 mt-2 md:mt-6">
            <button onClick={handleTweetAction} className="py-3 md:py-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all text-slate-300">
              <XIcon size={12} className="md:w-[14px] md:h-[14px]" /> Share Analysis
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

  const labelA = merket.optionA || 'YES';
  const labelB = merket.optionB || 'NO';

  useEffect(() => {
    if (merket.contractAddress) {
      fetchMarketCap(merket.contractAddress).then(setMcap);
    }
  }, [merket.contractAddress]);
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 md:p-6 flex flex-col h-full hover:border-blue-500/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden" onClick={() => onOpen(merket)}>
      <div className="flex justify-between items-start gap-3 md:gap-4 mb-4 min-h-[56px] md:min-h-[64px]">
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-slate-100 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{merket.question}</h3>
          {mcap && (
            <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[9px] uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded w-fit border border-blue-500/20">
              <BarChart size={10} /> MCAP: ${mcap}
            </div>
          )}
        </div>
        <div className="shrink-0"><img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-lg" /></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span><span>{labelA}: {yesProb}%</span></div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span><span>{labelB}: {100-yesProb}%</span></div>
        </div>
        <div className="shrink-0 scale-90 md:scale-100"><ChanceIndicator percentage={yesProb} /></div>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Star size={12} className="text-yellow-500/50" /> {totalVotes} Votes</span></div>
        <div className="flex items-center gap-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><span>Trade</span><Plus size={14} /></div>
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
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
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
            image: image || BRAND_LOGO,
            optionA: optionA.trim() || undefined,
            optionB: optionB.trim() || undefined
          }); 
          onCreated(); 
          onClose(); 
        } 
        catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <div className="bg-slate-900 w-full max-w-xl rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl text-white border border-slate-700 max-h-[90vh] overflow-y-auto custom-scroll">
                <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-slate-800 text-slate-300 rounded-full border border-slate-700"><X size={18} className="md:w-[20px] md:h-[20px]" /></button>
                <div className="mb-6 md:mb-8"><h2 className="text-3xl md:text-4xl font-bold tracking-tighter">New Market</h2><p className="text-blue-400 font-bold uppercase text-[10px] md:text-xs tracking-widest mt-1">Deploy terminal signal</p></div>
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Question (Required)</label><input required type="text" placeholder="Outcome question?" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3 md:p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 text-sm md:text-base" value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-[10px] font-bold uppercase text-green-500 mb-2 ml-1 tracking-widest">Option 1 (Optional)</label><input type="text" placeholder="YES" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3 md:p-4 font-medium text-green-400 focus:outline-none focus:ring-4 focus:ring-green-600/20 focus:border-green-600 text-sm md:text-base uppercase" value={optionA} onChange={(e) => setOptionA(e.target.value)} /></div>
                       <div><label className="block text-[10px] font-bold uppercase text-red-500 mb-2 ml-1 tracking-widest">Option 2 (Optional)</label><input type="text" placeholder="NO" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3 md:p-4 font-medium text-red-400 focus:outline-none focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-sm md:text-base uppercase" value={optionB} onChange={(e) => setOptionB(e.target.value)} /></div>
                    </div>

                    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Context (Optional)</label><textarea rows={2} placeholder="Provide details..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3 md:p-4 font-medium text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 resize-none text-sm md:text-base" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Solana CA (Optional)</label><input type="text" placeholder="Track Market Cap..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3 md:p-4 font-medium text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 text-sm md:text-base" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Proof Asset</label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800/80 transition-all cursor-pointer relative min-h-[100px] md:min-h-[120px]">{preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80" /> : <Plus size={32} className="text-slate-600" />}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div></div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 md:py-5 rounded-2xl text-lg md:text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-blue-500/20">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}</button>
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
    const previousVote = getUserVote(id);
    if (previousVote === option) return;

    setActionLoading(true);
    try {
        await voteMerket(id, option);
        const updated = await getMerkets();
        setMerkets(updated);
        
        if (selectedMerket && selectedMerket.id === id) {
            const fresh = updated.find(m => m.id === id);
            if (fresh) setSelectedMerket(fresh);
        }
    } catch (e) {
        console.error("Vote failed:", e);
    } finally {
        setActionLoading(false);
    }
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
        <div className="flex flex-wrap items-center gap-2 mb-8 md:mb-12 pb-5 border-b border-slate-800">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-lg overflow-x-auto max-w-[calc(100%-120px)] md:max-w-none no-scrollbar">
                <button onClick={() => setActiveFilter('top')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeFilter === 'top' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>Top</button>
                <button onClick={() => setActiveFilter('new')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeFilter === 'new' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>New</button>
                <button onClick={() => setActiveFilter('trending')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeFilter === 'trending' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>Trending</button>
            </div>
            <div className="ml-auto">
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-blue-500 text-white rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-wider hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/20">
                    <Plus size={16} className="md:w-[18px] md:h-[18px]" /> <span className="hidden md:inline">New Market</span><span className="md:hidden">New</span>
                </button>
            </div>
        </div>
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-blue-500" size={56} />
                <span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Syncing Terminal...</span>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
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
