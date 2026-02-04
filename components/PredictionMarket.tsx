
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteOnOption, getUserVote, createMarket, getComments, postComment, fetchMarketCap, checkAndResolveMarket } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment, MarketType, MarketStatus, MarketOption } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, Send, Target, Clock, CheckCircle, XCircle, Trash2, ServerCrash, RefreshCw } from 'lucide-react';
import { Chart, registerables } from 'https://esm.sh/chart.js';

Chart.register(...registerables);


const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const formatMcapTarget = (num: number): string => {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
    return num.toString();
};

const XIcon = ({ size = 16, className = "" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const VoteChart: React.FC<{ options: MarketOption[] }> = ({ options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const chartColors = ['#22c55e', '#ef4444', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        if (chartRef.current) {
            chartRef.current.destroy();
        }
        
        const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
        if (totalVotes === 0) { // Display a 50/50 split for new markets
             const evenSplitData = Array(options.length).fill(100 / options.length);
             const evenSplitLabels = options.map(o => `${o.option_text} (---%)`);
             chartRef.current = new Chart(ctx, { type: 'doughnut', data: { labels: evenSplitLabels, datasets: [{ data: evenSplitData, backgroundColor: chartColors.slice(0, options.length).map(c=>`${c}40`), borderColor: chartColors.slice(0, options.length), borderWidth: 2, hoverOffset: 8 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } } });
             return;
        }

        const chartData = options.map(o => o.votes);
        const chartLabels = options.map(o => `${o.option_text} (${((o.votes / totalVotes) * 100).toFixed(1)}%)`);
        const backgroundColors = options.map((_, i) => chartColors[i % chartColors.length]);
        
        chartRef.current = new Chart(ctx, { type: 'doughnut', data: { labels: chartLabels, datasets: [{ data: chartData, backgroundColor: backgroundColors, borderColor: '#1e293b', borderWidth: 4, hoverOffset: 12 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold' } } }, tooltip: { backgroundColor: 'rgba(5, 12, 24, 0.8)', borderColor: '#1f2937', borderWidth: 1, titleFont: { weight: 'bold' }, bodyFont: { weight: 'bold' }, padding: 10 } } } });

        return () => {
            chartRef.current?.destroy();
        };
    }, [options]);

    return ( <div className="w-full h-[250px] bg-slate-950 rounded-xl border border-slate-800 p-4 my-6 shadow-2xl relative flex items-center justify-center"> <canvas ref={canvasRef}></canvas> </div> );
};

const Countdown: React.FC<{ expiry: number }> = ({ expiry }) => {
    const [timeLeft, setTimeLeft] = useState(expiry - Date.now());
    useEffect(() => { const timer = setInterval(() => setTimeLeft(expiry - Date.now()), 1000); return () => clearInterval(timer); }, [expiry]);
    if (timeLeft <= 0) return <span>Expired</span>;
    const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24)); const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24); const m = Math.floor((timeLeft / 1000 / 60) % 60); const s = Math.floor((timeLeft / 1000) % 60);
    return <span>{d > 0 && `${d}d `}{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

const CompactCountdown: React.FC<{ expiry: number }> = ({ expiry }) => {
    const [timeLeft, setTimeLeft] = useState(expiry - Date.now());
    useEffect(() => { const timer = setInterval(() => setTimeLeft(expiry - Date.now()), 1000); return () => clearInterval(timer); }, [expiry]);
    if (timeLeft <= 0) return <>Expired</>;
    const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const m = Math.floor((timeLeft / 1000 / 60) % 60);
    if (d > 0) return <>{d}d left</>;
    if (h > 0) return <>{h}h left</>;
    return <>{m}m left</>;
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (marketId: string, newOptionId: string, status: MarketStatus) => void; isVoting: boolean; onMarketUpdate: (m: MerketType) => void; }> = ({ merket, onClose, onVote, isVoting, onMarketUpdate }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentUsername, setCommentUsername] = useState('');
  const [mcap, setMcap] = useState<{formatted: string, raw: number} | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(getUserVote(merket.id));
  
  useEffect(() => { setSelectedOptionId(getUserVote(merket.id)); }, [merket]);
  useEffect(() => { const savedUsername = localStorage.getItem('poly_username') || ''; setCommentUsername(savedUsername); const resolveCheck = async () => { const updatedMarket = await checkAndResolveMarket(merket); if (updatedMarket) onMarketUpdate(updatedMarket); }; if (merket.status === 'OPEN') resolveCheck(); }, [merket.id]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (merket.contractAddress) { const fetchMcap = () => fetchMarketCap(merket.contractAddress).then(setMcap); fetchMcap(); const interval = setInterval(fetchMcap, 15000); return () => clearInterval(interval); } }, [merket.contractAddress]);
  useEffect(() => { const fetchComments = async () => setComments(await getComments(merket.id)); fetchComments(); }, [merket.id]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [comments]);

  const handlePostComment = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!newComment.trim() || !commentUsername.trim()) { alert("Username and message are required."); return; }
    localStorage.setItem('poly_username', commentUsername);
    await postComment(merket.id, newComment, commentUsername); 
    setNewComment(''); 
    setComments(await getComments(merket.id)); 
  };
  
  const handleVoteClick = () => { if (selectedOptionId) onVote(merket.id, selectedOptionId, merket.status); };

  const handleShare = () => {
    const totalVotes = merket.options.reduce((acc, opt) => acc + opt.votes, 0);
    const voteDistribution = merket.options.map(opt => `${opt.option_text}: ${totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : (100 / merket.options.length).toFixed(1)}%`).join('\n');
    const shareText = `I'm predicting on: "${merket.question}"\n\n${voteDistribution}\n\nCast your vote on the Polymarket Terminal:`;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const shareUrl = `${baseUrl}#live-market:${slugify(merket.question)}`;
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
  };

  const isResolved = merket.status !== 'OPEN';
  const targetMcapFormatted = merket.targetMarketCap ? formatMcapTarget(merket.targetMarketCap) : '';
  const mcapProgress = mcap && merket.targetMarketCap ? (mcap.raw / merket.targetMarketCap) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md md:p-4">
      <div className="bg-slate-900 w-full md:max-w-5xl h-[100dvh] md:h-[90vh] md:max-h-[800px] rounded-none md:rounded-3xl border-t md:border border-slate-700 overflow-hidden flex flex-col md:flex-row shadow-2xl text-white relative">
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 z-20 p-2 bg-slate-800 border border-slate-700 rounded-full hover:scale-110 transition-transform"><X size={20} /></button>
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-5 md:p-12 overflow-y-auto custom-scroll flex-1">
            <div className="flex items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8 pr-10">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-blue-600 p-0.5 shrink-0 border border-slate-700 shadow-[0_0_20px_rgba(37,99,235,0.3)]"><img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover rounded-lg" /></div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight break-words">{merket.question}</h2>
            </div>
            {merket.marketType === 'MCAP_TARGET' && (
                <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5"><Target size={10} /> Target MCAP</div>
                            <div className="text-lg font-bold text-blue-400">${targetMcapFormatted}</div>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5"><Clock size={10} /> Time Left</div>
                            <div className="text-lg font-mono font-bold text-blue-400">{merket.expiresAt && <Countdown expiry={merket.expiresAt}/>}</div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Live MCAP: <span className="text-white font-mono text-xs">${mcap?.formatted || '...'}</span></div>
                            <div className="text-xs font-mono font-bold text-white">{mcapProgress.toFixed(1)}%</div>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full w-full">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{width: `${mcapProgress}%`}}></div>
                        </div>
                    </div>
                </div>
            )}
             {merket.marketType === 'STANDARD' && merket.expiresAt && !isResolved && (
                <div className="mb-6">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 max-w-[200px] mx-auto">
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center justify-center gap-1.5"><Clock size={10} /> Time Left</div>
                        <div className="text-lg font-mono font-bold text-blue-400 text-center"><Countdown expiry={merket.expiresAt}/></div>
                    </div>
                </div>
            )}
            { isResolved ? ( <div className={`p-8 my-6 rounded-3xl border-2 text-center ${merket.status === 'RESOLVED_YES' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}><h3 className="text-3xl font-bold flex items-center justify-center gap-3">{merket.status === 'RESOLVED_YES' ? <><CheckCircle /> Target Reached</> : <><XCircle/> Expired</>}</h3></div> ) : ( <VoteChart options={merket.options} /> )}
            {merket.description && <p className="text-sm md:text-lg font-medium text-slate-400 mb-8 md:mb-12 px-2 leading-relaxed">"{merket.description}"</p>}
            <div className="mt-8 border-t border-slate-800 pt-6 md:pt-8 pb-20 md:pb-0">
               {/* Comments section remains the same */}
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 md:mb-6 flex items-center gap-2"><MessageSquare size={14} /> Global Feed</h4>
              <div ref={scrollRef} className="space-y-3 md:space-y-4 max-h-48 md:max-h-64 overflow-y-auto custom-scroll pr-2 md:pr-4 mb-4 md:mb-6">{comments.length === 0 ? <div className="text-center py-8 text-slate-600 font-medium">Awaiting terminal signals...</div> : comments.map((c) => <div key={c.id} className="bg-slate-950 rounded-2xl p-3 md:p-4 border border-slate-800"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{c.username}</span><span className="text-[9px] text-slate-600 font-mono">{new Date(c.created_at).toLocaleTimeString()}</span></div><p className="text-xs md:text-sm font-medium text-slate-300">{c.content}</p></div>)}</div>
              <form onSubmit={handlePostComment} className={`flex flex-col md:flex-row gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-700 relative ${isResolved ? 'opacity-50' : 'focus-within:border-blue-500 transition-colors'}`}>
                <input required type="text" placeholder="Your name" maxLength={15} className="bg-slate-800 border-none px-3 py-2 text-xs md:text-sm font-medium text-white placeholder-slate-500 focus:outline-none rounded-lg w-full md:w-32" value={commentUsername} onChange={(e) => setCommentUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} disabled={isResolved} />
                <input required type="text" placeholder="Type message..." className="flex-1 bg-slate-800 border-none px-3 py-2 text-xs md:text-sm font-medium text-white placeholder-slate-500 focus:outline-none rounded-lg" value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isResolved} />
                <button type="submit" className="p-2 md:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg" disabled={isResolved}><Send size={14} className="md:w-4 md:h-4" /></button>
              </form>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 bg-slate-950 p-5 md:p-8 flex flex-col justify-center gap-2 border-t border-slate-700 md:border-t-0 md:border-l z-10 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none pb-8 md:pb-8 relative">
            <div className={`flex flex-col gap-2 ${isResolved ? 'opacity-40 pointer-events-none' : ''}`}>
                {merket.options.map(opt => (
                    <button key={opt.id} onClick={() => setSelectedOptionId(opt.id)} className={`w-full py-3 rounded-xl font-bold text-sm border-2 transition-all uppercase tracking-wider ${selectedOptionId === opt.id ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{opt.option_text}</button>
                ))}
            </div>
            <button onClick={handleVoteClick} disabled={!selectedOptionId || isVoting || isResolved} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2 shadow-xl uppercase tracking-wider text-sm">{isVoting ? <Loader2 className="animate-spin mx-auto" /> : (isResolved ? 'Market Closed' : 'Submit Vote')}</button>
            <div className="grid grid-cols-1 gap-3 mt-4"><button onClick={handleShare} className="py-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all text-slate-300"><XIcon size={12} /> Share Analysis</button></div>
        </div>
      </div>
    </div>
  );
};

const ChanceIndicator: React.FC<{ percentage: number; color?: string }> = ({ percentage, color = '#22c55e' }) => {
    const size = 60; const strokeWidth = 5; const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; const offset = circumference - (percentage / 100) * circumference;
    return ( <div className="relative flex items-center justify-center" style={{ width: size, height: size }}> <svg className="absolute w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}> <circle className="text-slate-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} /> <circle stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2} style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }} /> </svg> <div className="flex items-baseline"> <span className="text-xl font-bold" style={{ color }}>{percentage}</span> <span className="text-xs font-bold" style={{ color }}>%</span> </div> </div> );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const totalVotes = merket.options.reduce((acc, opt) => acc + opt.votes, 0);
  const sortedOptions = [...merket.options].sort((a, b) => b.votes - a.votes);
  const topOption = sortedOptions[0];
  const secondOption = sortedOptions[1];
  const topProb = totalVotes === 0 ? (100 / (merket.options.length || 1)) : (topOption.votes / totalVotes) * 100;

  const isResolved = merket.status !== 'OPEN';
  const hasExpiry = merket.expiresAt && !isResolved;

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-3xl p-5 md:p-6 flex flex-col h-full hover:border-blue-500/50 transition-all group shadow-xl relative overflow-hidden ${isResolved ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isResolved && onOpen(merket)}>
      {isResolved && ( <div className={`absolute top-3 right-3 text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${merket.status === 'RESOLVED_YES' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> {merket.status === 'RESOLVED_YES' ? 'Resolved' : 'Expired'} </div> )}
      <div className="flex justify-between items-start gap-3 md:gap-4 mb-4 min-h-[56px] md:min-h-[64px]">
        <div className="flex-1"> <h3 className="text-base md:text-lg font-bold text-slate-100 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{merket.question}</h3> {merket.marketType === 'MCAP_TARGET' && merket.targetMarketCap && ( <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[9px] uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded w-fit border border-blue-500/20"> <Target size={10} /> MCAP TARGET: ${formatMcapTarget(merket.targetMarketCap)} </div> )} </div>
        <div className="shrink-0"><img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-lg" /></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1.5 md:gap-2">
            {topOption && <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span><span>{topOption.option_text}: {topProb.toFixed(0)}%</span></div>}
            {secondOption && <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span><span>{secondOption.option_text}: {(totalVotes > 0 ? (secondOption.votes/totalVotes)*100 : 0).toFixed(0)}%</span></div> }
        </div>
        <div className="shrink-0 scale-90 md:scale-100"><ChanceIndicator percentage={Math.round(topProb)} /></div>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Star size={12} className="text-yellow-500/50" /> {totalVotes} Votes</span> {hasExpiry && (<span className="flex items-center gap-1"><Clock size={12}/> <CompactCountdown expiry={merket.expiresAt!} /></span>)}</div>
        <div className="flex items-center gap-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><span>{isResolved ? 'Details' : 'Trade'}</span><Plus size={14} /></div>
      </div>
    </div>
  );
};

const CreateMarketModal: React.FC<{ onClose: () => void; onCreated: () => void; }> = ({ onClose, onCreated }) => {
    const [marketType, setMarketType] = useState<MarketType>('STANDARD');
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState(['YES', 'NO']);
    const [contractAddress, setContractAddress] = useState('');
    const [targetMcapStr, setTargetMcapStr] = useState('');
    const [mcapTimeframe, setMcapTimeframe] = useState(24);
    const [stdTimeframe, setStdTimeframe] = useState<number | null>(null);
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [ticker, setTicker] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOptionChange = (index: number, value: string) => { const newOptions = [...options]; newOptions[index] = value; setOptions(newOptions); };
    const addOption = () => setOptions([...options, `Option ${options.length + 1}`]);
    const removeOption = (index: number) => { if (options.length > 2) { setOptions(options.filter((_, i) => i !== index)); } };
    
    useEffect(() => { const fetchTicker = async () => { if (marketType === 'MCAP_TARGET' && contractAddress.length > 32) { try { const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`); const data = await response.json(); if (data.pairs && data.pairs.length > 0) { setTicker(data.pairs[0].baseToken.symbol); } else { setTicker(null); } } catch (e) { setTicker(null); } } else { setTicker(null); } }; const timeoutId = setTimeout(fetchTicker, 500); return () => clearTimeout(timeoutId); }, [contractAddress, marketType]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result as string; setImage(base64); setPreview(base64); }; reader.readAsDataURL(file); };
    const parseMcapInput = (input: string): number => { const num = parseFloat(input); if (isNaN(num)) return 0; if (input.toLowerCase().includes('b')) return num * 1_000_000_000; if (input.toLowerCase().includes('m')) return num * 1_000_000; if (input.toLowerCase().includes('k')) return num * 1_000; return num; };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try { let marketData;
            if (marketType === 'MCAP_TARGET') { if (!contractAddress || !targetMcapStr) { alert("CA and Target MCAP are required."); setLoading(false); return; } const targetMarketCap = parseMcapInput(targetMcapStr); const formattedMcap = formatMcapTarget(targetMarketCap); const questionText = `Will $${ticker || 'this asset'} reach a $${formattedMcap} market cap within ${mcapTimeframe} hours?`; marketData = { marketType: 'MCAP_TARGET', question: questionText, description: description || `Tracking contract: ${contractAddress}`, contractAddress, targetMarketCap, expiresAt: Date.now() + mcapTimeframe * 60 * 60 * 1000, image: image || BRAND_LOGO, options: ['YES', 'NO'] };
            } else { if (!question.trim() || options.some(o => !o.trim()) || options.length < 2) { alert("Question and at least 2 valid options are required."); setLoading(false); return; } const expiresAt = stdTimeframe ? Date.now() + stdTimeframe * 60 * 60 * 1000 : undefined; marketData = { marketType: 'STANDARD', question, description, contractAddress, image: image || BRAND_LOGO, options, expiresAt }; }
            await createMarket(marketData); onCreated(); onClose();
        } catch (err: any) { console.error(err); alert(`Error: ${err.message || 'Could not create market.'}`);
        } finally { setLoading(false); }
    };
    
    return ( <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"> <div className="bg-slate-900 w-full max-w-xl rounded-3xl p-6 md:p-10 relative shadow-2xl text-white border border-slate-700 max-h-[90vh] overflow-y-auto custom-scroll"> <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-full border border-slate-700"><X size={20} /></button> <div className="mb-8"><h2 className="text-4xl font-bold tracking-tighter">New Market</h2><p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">Deploy terminal signal</p></div> <div className="flex bg-slate-800 p-1 rounded-full mb-6 border border-slate-700"><button onClick={()=>setMarketType('STANDARD')} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${marketType==='STANDARD'?'bg-blue-600 text-white':'text-slate-400'}`}>Standard</button><button onClick={()=>setMarketType('MCAP_TARGET')} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${marketType==='MCAP_TARGET'?'bg-blue-600 text-white':'text-slate-400'}`}>MCAP Target</button></div> <form onSubmit={handleSubmit} className="space-y-6"> {marketType === 'STANDARD' ? ( <> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Question</label><input required type="text" placeholder="e.g., Who will win the election?" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={question} onChange={(e) => setQuestion(e.target.value)} /></div> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Options</label><div className="space-y-2">{options.map((opt, i) => <div key={i} className="flex items-center gap-2"><input required type="text" value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} className="flex-grow bg-slate-800 border-2 border-slate-700 rounded-lg p-3 font-medium text-slate-100 focus:outline-none focus:border-blue-600" /><button type="button" onClick={() => removeOption(i)} disabled={options.length <= 2} className="p-3 bg-red-500/20 text-red-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={16}/></button></div>)}<button type="button" onClick={addOption} className="w-full mt-2 py-2 bg-slate-700 text-slate-300 rounded-lg font-bold text-xs uppercase hover:bg-slate-600">Add Option</button></div></div> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Timeframe (Optional)</label><select value={stdTimeframe ?? ''} onChange={(e) => setStdTimeframe(e.target.value ? Number(e.target.value) : null)} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"><option value="">No Expiry</option><option value={1}>1 Hour</option><option value={24}>24 Hours</option><option value={72}>3 Days</option><option value={168}>7 Days</option></select></div> </> ) : ( <> <div> <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Solana Contract Address</label> <div className="relative"> <input required type="text" placeholder="Enter Token CA..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 pr-20" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} /> {ticker && <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-500/30">${ticker}</span>} </div> </div> <div className="grid grid-cols-2 gap-4"> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Target MCAP</label><input required type="text" placeholder="e.g., 15M, 250K" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={targetMcapStr} onChange={(e) => setTargetMcapStr(e.target.value)} /></div> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Timeframe</label><select value={mcapTimeframe} onChange={(e)=>setMcapTimeframe(Number(e.target.value))} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"><option value={24}>24 Hours</option><option value={72}>3 Days</option><option value={168}>7 Days</option></select></div> </div> </> )} <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Context (Optional)</label><textarea rows={2} placeholder="Provide details..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Image</label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800/80 transition-all cursor-pointer relative min-h-[120px]">{preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80" /> : <Plus size={32} className="text-slate-600" />}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div></div> <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-blue-500/20">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}</button> </form> </div> </div> );
};

const PredictionMarket: React.FC = () => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'general' | 'mcap'>('general');
  const [activeSort, setActiveSort] = useState<'top' | 'new' | 'trending'>('top');
  const [dbError, setDbError] = useState<string|null>(null);

  const fetchInitialData = async () => {
    setLoading(true); setDbError(null);
    try {
        const data = await getMerkets(); setMerkets(data);
        const hash = window.location.hash;
        if (hash.includes(':')) {
            const slug = hash.split(':')[1];
            const target = data.find(m => slugify(m.question) === slug);
            if (target) setSelectedMerket(target);
        }
    } catch (error: any) { console.error("Failed to fetch markets:", error); setDbError("Could not connect to the database. Please check the terminal connection.");
    } finally { setLoading(false); }
  };
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setDbError(null);
    try {
        const data = await getMerkets();
        setMerkets(data);
    } catch (error: any) {
        console.error("Failed to refresh markets:", error);
        setDbError("Could not refresh markets. Please check the connection.");
    } finally {
        setIsRefreshing(false);
    }
  };


  useEffect(() => { fetchInitialData(); }, []);
  
  const handleVote = async (marketId: string, newOptionId: string, status: MarketStatus) => {
    if (status !== 'OPEN' || actionLoading) return;

    const oldOptionId = getUserVote(marketId);
    if (oldOptionId === newOptionId) return;
    
    setActionLoading(true);
    const originalMerkets = merkets;
    const originalSelectedMerket = selectedMerket;

    const optimisticMerkets = merkets.map(m => {
        if (m.id === marketId) {
            const newOptions = m.options.map(opt => {
                let voteChange = 0;
                if (opt.id === oldOptionId) voteChange = -1;
                if (opt.id === newOptionId) voteChange = 1;
                return { ...opt, votes: Math.max(0, opt.votes + voteChange) };
            });
            return { ...m, options: newOptions };
        }
        return m;
    });

    setMerkets(optimisticMerkets);
    if (selectedMerket?.id === marketId) { setSelectedMerket(optimisticMerkets.find(m => m.id === marketId) || null); }

    try {
        await voteOnOption(marketId, newOptionId, oldOptionId, status);
        const updatedFromDB = await getMerkets();
        setMerkets(updatedFromDB);
        if (selectedMerket?.id === marketId) { setSelectedMerket(updatedFromDB.find(m => m.id === marketId) || null); }
    } catch (e: any) {
        console.error("Vote failed, reverting UI:", e); alert(e.message || "Vote failed. Your vote was not saved.");
        setMerkets(originalMerkets); setSelectedMerket(originalSelectedMerket);
    } finally { setActionLoading(false); }
  };

  const handleMarketUpdate = (updatedMarket: MerketType) => { setMerkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m)); if (selectedMerket?.id === updatedMarket.id) { setSelectedMerket(updatedMarket); } };
  
  const sortedMerkets = useMemo(() => {
    const categoryMarkets = merkets.filter(m => activeCategory === 'mcap' ? m.marketType === 'MCAP_TARGET' : m.marketType !== 'MCAP_TARGET');
    const getSortScore = (m: MerketType) => m.options.reduce((acc, opt) => acc + opt.votes, 0);
    switch (activeSort) {
        case 'top': return categoryMarkets.sort((a, b) => getSortScore(b) - getSortScore(a));
        case 'new': return categoryMarkets.sort((a, b) => b.createdAt - a.createdAt);
        case 'trending': return categoryMarkets.sort((a, b) => { const scoreA = getSortScore(a) / Math.pow((Date.now() - a.createdAt) / 3600000, 1.8); const scoreB = getSortScore(b) / Math.pow((Date.now() - b.createdAt) / 3600000, 1.8); return scoreB - scoreA; });
        default: return categoryMarkets;
    }
  }, [merkets, activeCategory, activeSort]);
  
  return (
    <section id="merkets">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 md:mb-12 pb-5 border-b border-slate-800">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-lg w-full md:w-auto">
                <button onClick={() => setActiveCategory('general')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeCategory === 'general' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>General Markets</button>
                <button onClick={() => setActiveCategory('mcap')} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeCategory === 'mcap' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>MCAP Targets</button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-lg flex-grow">
                    <button onClick={() => setActiveSort('top')} className={`flex-1 px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${activeSort === 'top' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Top</button>
                    <button onClick={() => setActiveSort('new')} className={`flex-1 px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${activeSort === 'new' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>New</button>
                    <button onClick={() => setActiveSort('trending')} className={`flex-1 px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${activeSort === 'trending' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Trending</button>
                </div>
                <button onClick={handleRefresh} disabled={isRefreshing} className="p-2.5 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-lg border border-slate-700 shrink-0 disabled:opacity-50 disabled:cursor-wait">
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/20 shrink-0"> <Plus size={16} /> <span className="hidden md:inline">New Market</span> </button>
            </div>
        </div>
        
        {dbError && <div className="mb-4 text-center text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">{dbError}</div>}

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-blue-500" size={56} /><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Syncing Terminal...</span></div>
        ) : sortedMerkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
            {sortedMerkets.map(m => <MerketCard key={m.id} merket={m} onOpen={target => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />)}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <ServerCrash size={56} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-2xl font-bold text-slate-300">No Oracle Signals Detected.</h3>
            <p className="text-slate-500 mt-2 mb-6">The terminal is waiting for new prediction markets. Why not be the first to deploy one?</p>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-6 py-3 mx-auto bg-blue-500 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/20"> <Plus size={18} /> Deploy New Market </button>
          </div>
        )}
      </div>
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} onMarketUpdate={handleMarketUpdate} />}
      {isCreateOpen && <CreateMarketModal onClose={()=>setIsCreateOpen(false)} onCreated={fetchInitialData} />}
    </section>
  );
};
export default PredictionMarket;
