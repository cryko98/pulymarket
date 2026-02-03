
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment, fetchMarketCap, checkAndResolveMarket, getProfile } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment, MarketType, MarketStatus } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, Send, Target, Clock, CheckCircle, XCircle, User, LogOut, Info, Edit } from 'lucide-react';
import { Chart, registerables } from 'https://esm.sh/chart.js';
import Auth from './Auth';
import UsernameSetupModal from './UsernameSetup';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { PhantomIcon } from './wallet/PhantomIcon';

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

const MarketChart: React.FC<{ yesProb: number; marketId: string; optionA: string; optionB: string; }> = ({ yesProb, marketId, optionA, optionB }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        if (chartRef.current) chartRef.current.destroy();
        let seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seededRandom = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        const dataPoints = 100;
        const labels = Array.from({ length: dataPoints }, (_, i) => `T-${dataPoints - i}`);
        const data = Array.from({ length: dataPoints }, (_, i) => { const progress = i / (dataPoints - 1); const value = 50 + (yesProb - 50) * progress; const noise = (seededRandom() - 0.5) * (1 - progress) * 20; return Math.max(0, Math.min(100, i === dataPoints - 1 ? yesProb : value + noise)); });
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)'); gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
        chartRef.current = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: `${optionA} Probability`, data, borderColor: '#22c55e', borderWidth: 2.5, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: gradient, }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(5, 12, 24, 0.8)', borderColor: '#1f2937', borderWidth: 1, titleFont: { weight: 'bold' }, bodyFont: { weight: 'bold' }, padding: 10, callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(2)}%` } } }, scales: { x: { display: false }, y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#6b7280', font: { weight: 'bold' }, callback: (v) => `${v}%` } } } } });
        return () => chartRef.current?.destroy();
    }, [yesProb, marketId, optionA]);

    return ( <div className="w-full h-[250px] bg-slate-950 rounded-xl border border-slate-800 p-2 my-6 shadow-2xl relative"> <canvas ref={canvasRef}></canvas> <div className="absolute bottom-2 left-3 bg-black/60 px-3 py-1 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700 pointer-events-none"> SOURCE: POLY-ORACLE v2 </div> </div> );
};

const Countdown: React.FC<{ expiry: number }> = ({ expiry }) => {
    const [timeLeft, setTimeLeft] = useState(expiry - Date.now());
    useEffect(() => { const timer = setInterval(() => setTimeLeft(expiry - Date.now()), 1000); return () => clearInterval(timer); }, [expiry]);
    if (timeLeft <= 0) return <span>Expired</span>;
    const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24)); const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24); const m = Math.floor((timeLeft / 1000 / 60) % 60); const s = Math.floor((timeLeft / 1000) % 60);
    return <span>{d > 0 && `${d}d `}{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

const MerketDetailModal: React.FC<{ merket: MerketType; session: Session | null; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO', status: MarketStatus) => void; isVoting: boolean; onMarketUpdate: (m: MerketType) => void; onAuthOpen: () => void; }> = ({ merket, session, onClose, onVote, isVoting, onMarketUpdate, onAuthOpen }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [mcap, setMcap] = useState<{formatted: string, raw: number} | null>(null);
  
  useEffect(() => { const resolveCheck = async () => { const updatedMarket = await checkAndResolveMarket(merket); if (updatedMarket) onMarketUpdate(updatedMarket); }; if (merket.status === 'OPEN') resolveCheck(); }, [merket.id]);
  
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  const labelA = merket.optionA || 'YES'; const labelB = merket.optionB || 'NO';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (merket.contractAddress) { const fetchMcap = () => fetchMarketCap(merket.contractAddress).then(setMcap); fetchMcap(); const interval = setInterval(fetchMcap, 15000); return () => clearInterval(interval); } }, [merket.contractAddress]);
  useEffect(() => { const fetchComments = async () => setComments(await getComments(merket.id)); fetchComments(); }, [merket.id]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [comments]);

  const handlePostComment = async (e: React.FormEvent) => { e.preventDefault(); if (!newComment.trim()) return; if (!session) { onAuthOpen(); return; } await postComment(merket.id, newComment); setNewComment(''); setComments(await getComments(merket.id)); };
  
  const handleVoteClick = () => { if (!session) { onAuthOpen(); return; } if (selectedOption) onVote(merket.id, selectedOption, merket.status); };

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
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700"><div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5"><Target size={10} /> Target MCAP</div><div className="text-lg font-bold text-blue-400">${targetMcapFormatted}</div></div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700"><div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5"><Clock size={10} /> Time Left</div><div className="text-lg font-mono font-bold text-blue-400">{merket.expiresAt && <Countdown expiry={merket.expiresAt}/>}</div></div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1"><div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Live MCAP: <span className="text-white font-mono text-xs">${mcap?.formatted || '...'}</span></div><div className="text-xs font-mono font-bold text-white">{mcapProgress.toFixed(1)}%</div></div>
                        <div className="h-2 bg-slate-700 rounded-full w-full"><div className="h-full bg-blue-500 rounded-full transition-all" style={{width: `${mcapProgress}%`}}></div></div>
                    </div>
                </div>
            )}
            { isResolved ? ( <div className={`p-8 my-6 rounded-3xl border-2 text-center ${merket.status === 'RESOLVED_YES' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}><h3 className="text-3xl font-bold flex items-center justify-center gap-3">{merket.status === 'RESOLVED_YES' ? <><CheckCircle /> Target Reached</> : <><XCircle/> Expired</>}</h3></div> ) : ( <div className="mb-6 md:mb-8 p-4 md:p-8 bg-slate-950/50 rounded-3xl border border-slate-800 relative"> <div className="flex justify-between items-end mb-4 md:mb-6 font-bold tracking-tight"><div className="flex flex-col"><span className="text-green-400 text-[10px] tracking-widest mb-1 opacity-70 font-bold uppercase">{labelA} Signal</span><span className="text-2xl md:text-4xl text-green-500">{yesProb}% {labelA}</span></div><div className="flex flex-col items-end"><span className="text-red-400 text-[10px] tracking-widest mb-1 opacity-70 font-bold uppercase">{labelB} Signal</span><span className="text-2xl md:text-4xl text-red-500">{100-yesProb}% {labelB}</span></div></div> <div className="h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden flex mb-4 md:mb-6 border border-slate-700"><div className="h-full bg-green-600 transition-all duration-1000" style={{ width: `${yesProb}%` }} /><div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${100-yesProb}%` }} /></div> <MarketChart yesProb={yesProb} marketId={merket.id} optionA={labelA} optionB={labelB} /> </div> )}
            {merket.description && <p className="text-sm md:text-lg font-medium text-slate-400 mb-8 md:mb-12 px-2 leading-relaxed">"{merket.description}"</p>}
            <div className="mt-8 border-t border-slate-800 pt-6 md:pt-8 pb-20 md:pb-0">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 md:mb-6 flex items-center gap-2"><MessageSquare size={14} /> Global Feed</h4>
              <div ref={scrollRef} className="space-y-3 md:space-y-4 max-h-48 md:max-h-64 overflow-y-auto custom-scroll pr-2 md:pr-4 mb-4 md:mb-6">{comments.length === 0 ? <div className="text-center py-8 text-slate-600 font-medium">Awaiting terminal signals...</div> : comments.map((c) => <div key={c.id} className="bg-slate-950 rounded-2xl p-3 md:p-4 border border-slate-800"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{c.profiles?.username || 'anon'}</span><span className="text-[9px] text-slate-600 font-mono">{new Date(c.created_at).toLocaleTimeString()}</span></div><p className="text-xs md:text-sm font-medium text-slate-300">{c.content}</p></div>)}</div>
              <form onSubmit={handlePostComment} className={`flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-700 relative ${isResolved ? 'opacity-50' : 'focus-within:border-blue-500 transition-colors'}`}>
                <input required type="text" placeholder="Type message..." className="flex-1 bg-transparent border-none px-2 md:px-3 py-2 text-xs md:text-sm font-medium text-white placeholder-slate-500 focus:outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isResolved} />
                <button type="submit" className="p-2 md:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg" disabled={isResolved}><Send size={14} className="md:w-4 md:h-4" /></button>
                {!session && !isResolved && ( <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl"> <button onClick={onAuthOpen} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">Sign In to Comment</button> </div> )}
              </form>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 bg-slate-950 p-5 md:p-12 flex flex-col justify-center gap-3 md:gap-4 border-t border-slate-700 md:border-t-0 md:border-l z-10 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none pb-8 md:pb-12 relative">
            <div className={`flex md:flex-col gap-3 ${isResolved ? 'opacity-40 pointer-events-none' : ''}`}><button onClick={() => setSelectedOption('YES')} className={`flex-1 md:w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-lg border-2 transition-all uppercase tracking-wider ${selectedOption === 'YES' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{labelA}</button><button onClick={() => setSelectedOption('NO')} className={`flex-1 md:w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-lg border-2 transition-all uppercase tracking-wider ${selectedOption === 'NO' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{labelB}</button></div>
            <button onClick={handleVoteClick} disabled={!selectedOption || isVoting || isResolved} className="w-full bg-blue-600 text-white font-bold py-4 md:py-5 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2 md:mt-4 shadow-xl uppercase tracking-wider text-sm md:text-base">{isVoting ? <Loader2 className="animate-spin mx-auto" /> : (isResolved ? 'Market Closed' : 'Submit Vote')}</button>
            <div className="grid grid-cols-1 gap-3 mt-2 md:mt-6"><button className="py-3 md:py-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all text-slate-300"><XIcon size={12} className="md:w-[14px] md:h-[14px]" /> Share Analysis</button></div>
            {!session && !isResolved && ( <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"> <div className="text-center"> <h3 className="text-lg font-bold text-white mb-4">Login Required</h3> <p className="text-sm text-slate-400 mb-6">You must be logged in to cast a vote on this market.</p> <button onClick={onAuthOpen} className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg">Sign In to Vote</button> </div> </div> )}
        </div>
      </div>
    </div>
  );
};

const ChanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
    const color = percentage >= 50 ? '#22c55e' : '#ef4444'; const size = 60; const strokeWidth = 5; const radius = (size - strokeWidth) / 2; const circumference = 2 * Math.PI * radius; const offset = circumference - (percentage / 100) * circumference;
    return ( <div className="relative flex items-center justify-center" style={{ width: size, height: size }}> <svg className="absolute w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}> <circle className="text-slate-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={size / 2} cy={size / 2} /> <circle stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2} style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }} /> </svg> <div className="flex items-baseline"> <span className="text-xl font-bold" style={{ color }}>{percentage}</span> <span className="text-xs font-bold" style={{ color }}>%</span> </div> </div> );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const totalVotes = merket.yesVotes + merket.noVotes; const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100); const labelA = merket.optionA || 'YES'; const labelB = merket.optionB || 'NO'; const isResolved = merket.status !== 'OPEN';
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-3xl p-5 md:p-6 flex flex-col h-full hover:border-blue-500/50 transition-all group shadow-xl relative overflow-hidden ${isResolved ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isResolved && onOpen(merket)}>
      {isResolved && ( <div className={`absolute top-3 right-3 text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${merket.status === 'RESOLVED_YES' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}> {merket.status === 'RESOLVED_YES' ? 'Resolved' : 'Expired'} </div> )}
      <div className="flex justify-between items-start gap-3 md:gap-4 mb-4 min-h-[56px] md:min-h-[64px]">
        <div className="flex-1"> <h3 className="text-base md:text-lg font-bold text-slate-100 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{merket.question}</h3> {merket.marketType === 'MCAP_TARGET' && merket.targetMarketCap && ( <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[9px] uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded w-fit border border-blue-500/20"> <Target size={10} /> MCAP TARGET: ${formatMcapTarget(merket.targetMarketCap)} </div> )} </div>
        <div className="shrink-0"><img src={merket.image || BRAND_LOGO} className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-lg" /></div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1.5 md:gap-2"> <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span><span>{labelA}: {yesProb}%</span></div> <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span><span>{labelB}: {100-yesProb}%</span></div> </div>
        <div className="shrink-0 scale-90 md:scale-100"><ChanceIndicator percentage={yesProb} /></div>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 tracking-wider">
        <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Star size={12} className="text-yellow-500/50" /> {totalVotes} Votes</span></div>
        <div className="flex items-center gap-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"><span>{isResolved ? 'Details' : 'Trade'}</span><Plus size={14} /></div>
      </div>
    </div>
  );
};

const CreateMarketModal: React.FC<{ onClose: () => void; onCreated: () => void; }> = ({ onClose, onCreated }) => {
    const [marketType, setMarketType] = useState<MarketType>('STANDARD');
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [contractAddress, setContractAddress] = useState('');
    const [targetMcapStr, setTargetMcapStr] = useState('');
    const [timeframe, setTimeframe] = useState(24);
    const [image, setImage] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [ticker, setTicker] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { const fetchTicker = async () => { if (marketType === 'MCAP_TARGET' && contractAddress.length > 32) { try { const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`); const data = await response.json(); if (data.pairs && data.pairs.length > 0) { setTicker(data.pairs[0].baseToken.symbol); } else { setTicker(null); } } catch (e) { setTicker(null); } } else { setTicker(null); } }; const timeoutId = setTimeout(fetchTicker, 500); return () => clearTimeout(timeoutId); }, [contractAddress, marketType]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result as string; setImage(base64); setPreview(base64); }; reader.readAsDataURL(file); };
    const parseMcapInput = (input: string): number => { const num = parseFloat(input); if (isNaN(num)) return 0; if (input.toLowerCase().includes('m')) return num * 1_000_000; if (input.toLowerCase().includes('k')) return num * 1_000; return num; };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try { let marketData: Omit<MerketType, 'id' | 'yesVotes' | 'noVotes' | 'createdAt' | 'status'>;
            if (marketType === 'MCAP_TARGET') { if (!contractAddress || !targetMcapStr) { alert("CA and Target MCAP are required."); setLoading(false); return; } const targetMarketCap = parseMcapInput(targetMcapStr); const formattedMcap = formatMcapTarget(targetMarketCap); const questionText = `Will $${ticker || 'this asset'} reach a $${formattedMcap} market cap within ${timeframe} hours?`; marketData = { marketType: 'MCAP_TARGET', question: questionText, description: description || `Tracking contract: ${contractAddress}`, contractAddress, targetMarketCap, expiresAt: Date.now() + timeframe * 60 * 60 * 1000, image: image || BRAND_LOGO, };
            } else { if (!question.trim()) { alert("Question is required."); setLoading(false); return; } marketData = { marketType: 'STANDARD', question, description, contractAddress, image: image || BRAND_LOGO }; }
            await createMarket(marketData); onCreated(); onClose();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    
    return ( <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"> <div className="bg-slate-900 w-full max-w-xl rounded-3xl p-6 md:p-10 relative shadow-2xl text-white border border-slate-700 max-h-[90vh] overflow-y-auto custom-scroll"> <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-full border border-slate-700"><X size={20} /></button> <div className="mb-8"><h2 className="text-4xl font-bold tracking-tighter">New Market</h2><p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">Deploy terminal signal</p></div> <div className="flex bg-slate-800 p-1 rounded-full mb-6 border border-slate-700"><button onClick={()=>setMarketType('STANDARD')} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${marketType==='STANDARD'?'bg-blue-600 text-white':'text-slate-400'}`}>Standard</button><button onClick={()=>setMarketType('MCAP_TARGET')} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${marketType==='MCAP_TARGET'?'bg-blue-600 text-white':'text-slate-400'}`}>MCAP Target</button></div> <form onSubmit={handleSubmit} className="space-y-6"> {marketType === 'STANDARD' ? ( <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Question</label><input required type="text" placeholder="e.g., Will SOL flip ETH this cycle?" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={question} onChange={(e) => setQuestion(e.target.value)} /></div> ) : ( <> <div> <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Solana Contract Address</label> <div className="relative"> <input required type="text" placeholder="Enter Token CA..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 pr-20" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} /> {ticker && <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-500/30">${ticker}</span>} </div> </div> <div className="grid grid-cols-2 gap-4"> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Target MCAP</label><input required type="text" placeholder="e.g., 15M, 250K" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={targetMcapStr} onChange={(e) => setTargetMcapStr(e.target.value)} /></div> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Timeframe</label><select value={timeframe} onChange={(e)=>setTimeframe(Number(e.target.value))} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"><option value={24}>24 Hours</option><option value={72}>3 Days</option><option value={168}>7 Days</option></select></div> </div> </> )} <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Context (Optional)</label><textarea rows={2} placeholder="Provide details..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div> <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Image</label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800/80 transition-all cursor-pointer relative min-h-[120px]">{preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80" /> : <Plus size={32} className="text-slate-600" />}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div></div> <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-blue-500/20">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}</button> </form> </div> </div> );
};

const AuthBar: React.FC<{ session: Session | null; profile: { username: string } | null; onLogin: () => void; onEditProfile: () => void; }> = ({ session, profile, onLogin, onEditProfile }) => {
    const handleLogout = async () => { await supabase.auth.signOut(); };

    if (session) {
        const isPhantomUser = session.user.email?.endsWith('@phantom.app');
        const displayName = profile?.username ?? (isPhantomUser ? `${session.user.email.slice(0, 4)}...${session.user.email.slice(40)}` : session.user.email);

        return (
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        {isPhantomUser && <PhantomIcon size={14} />}
                        {displayName}
                        <button onClick={onEditProfile} className="text-slate-400 hover:text-white"><Edit size={12} /></button>
                    </div>
                    <div className="text-[9px] text-blue-400 uppercase tracking-widest font-bold">Authenticated</div>
                </div>
                <button onClick={handleLogout} title="Logout" className="p-2.5 bg-slate-800 border border-slate-700 rounded-full hover:bg-red-500/20 hover:border-red-500 transition-colors"><LogOut size={16} /></button>
            </div>
        );
    }
    return ( <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all border border-slate-700 shadow-lg"> <User size={16} /> Login / Sign Up </button> );
};


const PredictionMarket: React.FC = () => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'general' | 'mcap'>('general');
  const [activeSort, setActiveSort] = useState<'top' | 'new' | 'trending'>('top');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session) {
            const userProfile = await getProfile();
            setProfile(userProfile);
        }
    };
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);
        if (session) {
            const userProfile = await getProfile();
            setProfile(userProfile);
            if (localStorage.getItem('isNewUser')) {
                localStorage.removeItem('isNewUser');
                setShowUsernameSetup(true);
            }
        } else {
            setProfile(null);
        }
    });
    return () => subscription.unsubscribe();
  }, []);
  
  const handleUsernameUpdated = async () => {
      setShowUsernameSetup(false);
      const userProfile = await getProfile();
      setProfile(userProfile);
  };

  const refreshMarkets = async () => { setLoading(true); const data = await getMerkets(); setMerkets(data); setLoading(false); };

  useEffect(() => {
    getMerkets().then(data => {
      setMerkets(data); setLoading(false);
      const hash = window.location.hash; if (hash.includes(':')) { const slug = hash.split(':')[1]; const target = data.find(m => slugify(m.question) === slug); if (target) setSelectedMerket(target); }
    });
  }, []);

  const handleVote = async (id: string, option: 'YES' | 'NO', status: MarketStatus) => {
    if (!session) { setShowAuthModal(true); return; }
    setActionLoading(true);
    try { await voteMerket(id, option, status); const updated = await getMerkets(); setMerkets(updated); if (selectedMerket?.id === id) { const newSelected = updated.find(m => m.id === id) || null; setSelectedMerket(newSelected); }
    } catch (e) { console.error("Vote failed:", e); alert("Vote failed. Please ensure you are logged in."); setShowAuthModal(true); } finally { setActionLoading(false); }
  };

  const handleMarketUpdate = (updatedMarket: MerketType) => { setMerkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m)); if (selectedMerket?.id === updatedMarket.id) { setSelectedMerket(updatedMarket); } };
  
  const handleCreateMarketOpen = () => { if (!session) { setShowAuthModal(true); } else { setIsCreateOpen(true); } };

  const sortedMerkets = useMemo(() => {
    const categoryMarkets = merkets.filter(m => activeCategory === 'mcap' ? m.marketType === 'MCAP_TARGET' : m.marketType === 'STANDARD');
    switch (activeSort) {
        case 'top': return categoryMarkets.sort((a, b) => (b.yesVotes + b.noVotes) - (a.yesVotes + a.noVotes));
        case 'new': return categoryMarkets.sort((a, b) => b.createdAt - a.createdAt);
        case 'trending': return categoryMarkets.sort((a, b) => { const scoreA = (a.yesVotes + a.noVotes) / Math.pow((Date.now() - a.createdAt) / 3600000, 1.8); const scoreB = (b.yesVotes + b.noVotes) / Math.pow((Date.now() - b.createdAt) / 3600000, 1.8); return scoreB - scoreA; });
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
                
                <button onClick={handleCreateMarketOpen} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/20 shrink-0">
                    <Plus size={16} /> <span className="hidden md:inline">New Market</span>
                </button>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 rounded-full p-2 pr-4 text-xs text-slate-400">
                <Info size={16} className="text-blue-500 shrink-0" />
                <span className="font-bold">To create a market or vote on an outcome, please log in.</span>
            </div>
            <AuthBar session={session} profile={profile} onLogin={() => setShowAuthModal(true)} onEditProfile={() => setShowUsernameSetup(true)} />
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-blue-500" size={56} /><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Syncing Terminal...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
            {sortedMerkets.map(m => <MerketCard key={m.id} merket={m} onOpen={target => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />)}
          </div>
        )}
      </div>
      {selectedMerket && <MerketDetailModal merket={selectedMerket} session={session} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} onMarketUpdate={handleMarketUpdate} onAuthOpen={() => setShowAuthModal(true)} />}
      {isCreateOpen && <CreateMarketModal onClose={()=>setIsCreateOpen(false)} onCreated={refreshMarkets} />}
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
      {showUsernameSetup && <UsernameSetupModal onClose={handleUsernameUpdated} />}
    </section>
  );
};
export default PredictionMarket;
