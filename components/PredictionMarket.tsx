
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getMerkets, voteMerket, getUserVote, createMarket, getComments, postComment, fetchMarketCap, checkAndResolveMarket } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment, MarketType, MarketStatus } from '../types';
import { Loader2, X, Plus, MessageSquare, Star, Send, BarChart, Target, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Chart, registerables } from 'https://esm.sh/chart.js';
Chart.register(...registerables);


const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

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
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        
        const dataPoints = 100;
        const labels = Array.from({ length: dataPoints }, (_, i) => `T-${dataPoints - i}`);
        const data = Array.from({ length: dataPoints }, (_, i) => {
            const progress = i / (dataPoints - 1);
            const value = 50 + (yesProb - 50) * progress;
            const noise = (seededRandom() - 0.5) * (1 - progress) * 20;
            return Math.max(0, Math.min(100, i === dataPoints - 1 ? yesProb : value + noise));
        });

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: `${optionA} Probability`, data, borderColor: '#22c55e',
                    borderWidth: 2.5, pointRadius: 0, tension: 0.4, fill: true, backgroundColor: gradient,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(5, 12, 24, 0.8)', borderColor: '#1f2937', borderWidth: 1, titleFont: { weight: 'bold' }, bodyFont: { weight: 'bold' }, padding: 10, callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(2)}%` } } },
                scales: { x: { display: false }, y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#6b7280', font: { weight: 'bold' }, callback: (v) => `${v}%` } } }
            }
        });

        return () => chartRef.current?.destroy();
    }, [yesProb, marketId, optionA]);

    return (
        <div className="w-full h-[250px] bg-slate-950 rounded-xl border border-slate-800 p-2 my-6 shadow-2xl relative">
            <canvas ref={canvasRef}></canvas>
             <div className="absolute bottom-2 left-3 bg-black/60 px-3 py-1 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700 pointer-events-none">
                SOURCE: POLY-ORACLE v2
            </div>
        </div>
    );
};

const Countdown: React.FC<{ expiry: number }> = ({ expiry }) => {
    const [timeLeft, setTimeLeft] = useState(expiry - Date.now());
    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(expiry - Date.now()), 1000);
        return () => clearInterval(timer);
    }, [expiry]);
    if (timeLeft <= 0) return <span>Expired</span>;
    const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const h = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const m = Math.floor((timeLeft / 1000 / 60) % 60);
    const s = Math.floor((timeLeft / 1000) % 60);
    return <span>{d > 0 && `${d}d `}{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO', status: MarketStatus) => void; isVoting: boolean; onMarketUpdate: (m: MerketType) => void }> = ({ merket, onClose, onVote, isVoting, onMarketUpdate }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('poly_username') || '');
  const [mcap, setMcap] = useState<{formatted: string, raw: number} | null>(null);

  useEffect(() => {
    const resolveCheck = async () => {
        const updatedMarket = await checkAndResolveMarket(merket);
        if (updatedMarket) onMarketUpdate(updatedMarket);
    };
    if (merket.status === 'OPEN') resolveCheck();
  }, [merket.id]);
  
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const labelA = merket.optionA || 'YES';
  const labelB = merket.optionB || 'NO';

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (merket.contractAddress) {
      const fetchMcap = () => fetchMarketCap(merket.contractAddress).then(setMcap);
      fetchMcap();
      const interval = setInterval(fetchMcap, 15000); // Poll mcap
      return () => clearInterval(interval);
    }
  }, [merket.contractAddress]);

  useEffect(() => {
    const fetchComments = async () => setComments(await getComments(merket.id));
    fetchComments();
    const interval = setInterval(fetchComments, 4000);
    return () => clearInterval(interval);
  }, [merket.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [comments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !username.trim()) return;
    localStorage.setItem('poly_username', username);
    await postComment(merket.id, username, newComment);
    setNewComment('');
    setComments(await getComments(merket.id));
  };
  
  const handleTweetAction = () => { /* ... */ };

  const isResolved = merket.status !== 'OPEN';
  const targetMcapFormatted = merket.targetMarketCap ? `${(merket.targetMarketCap / 1_000_000).toFixed(1)}M` : '';
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
            
            { isResolved ? (
                <div className={`p-8 my-6 rounded-3xl border-2 text-center ${merket.status === 'RESOLVED_YES' ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                    <h3 className="text-3xl font-bold flex items-center justify-center gap-3">{merket.status === 'RESOLVED_YES' ? <><CheckCircle /> Target Reached</> : <><XCircle/> Expired</>}</h3>
                </div>
            ) : (
                <div className="mb-6 md:mb-8 p-4 md:p-8 bg-slate-950/50 rounded-3xl border border-slate-800 relative">
                   <div className="flex justify-between items-end mb-4 md:mb-6 font-bold tracking-tight"><div className="flex flex-col"><span className="text-green-400 text-[10px] tracking-widest mb-1 opacity-70 font-bold uppercase">{labelA} Signal</span><span className="text-2xl md:text-4xl text-green-500">{yesProb}% {labelA}</span></div><div className="flex flex-col items-end"><span className="text-red-400 text-[10px] tracking-widest mb-1 opacity-70 font-bold uppercase">{labelB} Signal</span><span className="text-2xl md:text-4xl text-red-500">{100-yesProb}% {labelB}</span></div></div>
                   <div className="h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden flex mb-4 md:mb-6 border border-slate-700"><div className="h-full bg-green-600 transition-all duration-1000" style={{ width: `${yesProb}%` }} /><div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${100-yesProb}%` }} /></div>
                   <MarketChart yesProb={yesProb} marketId={merket.id} optionA={labelA} optionB={labelB} />
                </div>
            )}
            {merket.description && <p className="text-sm md:text-lg font-medium text-slate-400 mb-8 md:mb-12 px-2 leading-relaxed">"{merket.description}"</p>}
            <div className="mt-8 border-t border-slate-800 pt-6 md:pt-8 pb-20 md:pb-0">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 md:mb-6 flex items-center gap-2"><MessageSquare size={14} /> Global Feed</h4>
              <div ref={scrollRef} className="space-y-3 md:space-y-4 max-h-48 md:max-h-64 overflow-y-auto custom-scroll pr-2 md:pr-4 mb-4 md:mb-6">{comments.length === 0 ? <div className="text-center py-8 text-slate-600 font-medium">Awaiting terminal signals...</div> : comments.map((c) => <div key={c.id} className="bg-slate-950 rounded-2xl p-3 md:p-4 border border-slate-800"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{c.username}</span><span className="text-[9px] text-slate-600 font-mono">{new Date(c.created_at).toLocaleTimeString()}</span></div><p className="text-xs md:text-sm font-medium text-slate-300">{c.content}</p></div>)}</div>
              <form onSubmit={handlePostComment} className={`flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-700 ${isResolved ? 'opacity-50' : 'focus-within:border-blue-500 transition-colors'}`}><input required type="text" placeholder="Alias" className="w-20 md:w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold text-blue-400 placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isResolved} /><input required type="text" placeholder="Type message..." className="flex-1 bg-transparent border-none px-2 md:px-3 py-2 text-xs md:text-sm font-medium text-white placeholder-slate-500 focus:outline-none" value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isResolved} /><button type="submit" className="p-2 md:p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg" disabled={isResolved}><Send size={14} className="md:w-4 md:h-4" /></button></form>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80 bg-slate-950 p-5 md:p-12 flex flex-col justify-center gap-3 md:gap-4 border-t border-slate-700 md:border-t-0 md:border-l z-10 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-none pb-8 md:pb-12">
            <div className={`flex md:flex-col gap-3 ${isResolved ? 'opacity-40 pointer-events-none' : ''}`}><button onClick={() => setSelectedOption('YES')} className={`flex-1 md:w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-lg border-2 transition-all uppercase tracking-wider ${selectedOption === 'YES' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{labelA}</button><button onClick={() => setSelectedOption('NO')} className={`flex-1 md:w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-lg border-2 transition-all uppercase tracking-wider ${selectedOption === 'NO' ? 'bg-red-500/10 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-400'}`}>{labelB}</button></div>
            <button onClick={() => onVote(merket.id, selectedOption!, merket.status)} disabled={!selectedOption || isVoting || isResolved} className="w-full bg-blue-600 text-white font-bold py-4 md:py-5 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2 md:mt-4 shadow-xl uppercase tracking-wider text-sm md:text-base">{isVoting ? <Loader2 className="animate-spin mx-auto" /> : (isResolved ? 'Market Closed' : 'Submit Vote')}</button>
            <div className="grid grid-cols-1 gap-3 mt-2 md:mt-6"><button onClick={handleTweetAction} className="py-3 md:py-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all text-slate-300"><XIcon size={12} className="md:w-[14px] md:h-[14px]" /> Share Analysis</button></div>
        </div>
      </div>
    </div>
  );
};

// Fix: Added the missing ChanceIndicator component.
const ChanceIndicator: React.FC<{ percentage: number }> = ({ percentage }) => {
    const color = percentage >= 50 ? '#22c55e' : '#ef4444'; // green-500, red-500
    const size = 60;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    className="text-slate-700"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
                />
            </svg>
            <div className="flex items-baseline">
                <span className="text-xl font-bold" style={{ color }}>{percentage}</span>
                <span className="text-xs font-bold" style={{ color }}>%</span>
            </div>
        </div>
    );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const labelA = merket.optionA || 'YES';
  const labelB = merket.optionB || 'NO';
  const isResolved = merket.status !== 'OPEN';

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-3xl p-5 md:p-6 flex flex-col h-full hover:border-blue-500/50 transition-all group shadow-xl relative overflow-hidden ${isResolved ? 'opacity-60' : 'cursor-pointer'}`} onClick={() => !isResolved && onOpen(merket)}>
      {isResolved && (
          <div className={`absolute top-3 right-3 text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${merket.status === 'RESOLVED_YES' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {merket.status === 'RESOLVED_YES' ? 'Resolved' : 'Expired'}
          </div>
      )}
      <div className="flex justify-between items-start gap-3 md:gap-4 mb-4 min-h-[56px] md:min-h-[64px]">
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-slate-100 leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">{merket.question}</h3>
          {merket.marketType === 'MCAP_TARGET' && merket.targetMarketCap && (
            <div className="flex items-center gap-1.5 text-blue-400 font-mono text-[9px] uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded w-fit border border-blue-500/20">
              <Target size={10} /> MCAP TARGET: ${(merket.targetMarketCap/1_000_000).toFixed(1)}M
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => { const base64 = reader.result as string; setImage(base64); setPreview(base64); };
        reader.readAsDataURL(file);
    };

    const parseMcapInput = (input: string): number => {
        const num = parseFloat(input);
        if (isNaN(num)) return 0;
        if (input.toLowerCase().includes('m')) return num * 1_000_000;
        if (input.toLowerCase().includes('k')) return num * 1_000;
        return num;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            let marketData: Omit<MerketType, 'id' | 'yesVotes' | 'noVotes' | 'createdAt' | 'status'>;
            if (marketType === 'MCAP_TARGET') {
                if (!contractAddress || !targetMcapStr) { alert("CA and Target MCAP are required."); setLoading(false); return; }
                const targetMarketCap = parseMcapInput(targetMcapStr);
                marketData = {
                    marketType: 'MCAP_TARGET',
                    question: `Will this asset reach a $${targetMcapStr.toUpperCase()} market cap within ${timeframe} hours?`,
                    description: description || `Tracking contract: ${contractAddress}`,
                    contractAddress,
                    targetMarketCap,
                    expiresAt: Date.now() + timeframe * 60 * 60 * 1000,
                    image: image || BRAND_LOGO,
                };
            } else {
                if (!question.trim()) { alert("Question is required."); setLoading(false); return; }
                marketData = { marketType: 'STANDARD', question, description, contractAddress, image: image || BRAND_LOGO };
            }
            await createMarket(marketData);
            onCreated(); onClose();
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <div className="bg-slate-900 w-full max-w-xl rounded-3xl p-6 md:p-10 relative shadow-2xl text-white border border-slate-700 max-h-[90vh] overflow-y-auto custom-scroll">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-300 rounded-full border border-slate-700"><X size={20} /></button>
                <div className="mb-8"><h2 className="text-4xl font-bold tracking-tighter">New Market</h2><p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">Deploy terminal signal</p></div>
                
                <div className="flex bg-slate-800 p-1 rounded-full mb-6 border border-slate-700"><button onClick={()=>setMarketType('STANDARD')} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${marketType==='STANDARD'?'bg-blue-600 text-white':'text-slate-400'}`}>Standard</button><button onClick={()=>setMarketType('MCAP_TARGET')} className={`flex-1 py-2 rounded-full text-sm font-bold uppercase ${marketType==='MCAP_TARGET'?'bg-blue-600 text-white':'text-slate-400'}`}>MCAP Target</button></div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {marketType === 'STANDARD' ? (
                        <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Question</label><input required type="text" placeholder="e.g., Will SOL flip ETH this cycle?" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={question} onChange={(e) => setQuestion(e.target.value)} /></div>
                    ) : (
                        <>
                          <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Solana Contract Address</label><input required type="text" placeholder="Enter Token CA..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Target MCAP</label><input required type="text" placeholder="e.g., 15M, 250K" className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600" value={targetMcapStr} onChange={(e) => setTargetMcapStr(e.target.value)} /></div>
                              <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Timeframe</label><select value={timeframe} onChange={(e)=>setTimeframe(Number(e.target.value))} className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600"><option value={24}>24 Hours</option><option value={72}>3 Days</option><option value={168}>7 Days</option></select></div>
                          </div>
                        </>
                    )}
                    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Context (Optional)</label><textarea rows={2} placeholder="Provide details..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 font-medium text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    <div><label className="block text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-widest">Image</label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800/80 transition-all cursor-pointer relative min-h-[120px]">{preview ? <img src={preview} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-80" /> : <Plus size={32} className="text-slate-600" />}<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div></div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl text-xl hover:bg-blue-700 transition-all disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-blue-500/20">{loading ? <Loader2 className="animate-spin mx-auto" /> : "Initiate Terminal"}</button>
                </form>
            </div>
        </div>
    );
};


const PredictionMarket: React.FC = () => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'top' | 'new' | 'mcap' | 'trending'>('top');

  const refreshMarkets = async () => {
      setLoading(true);
      const data = await getMerkets();
      setMerkets(data);
      setLoading(false);
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

  const handleVote = async (id: string, option: 'YES' | 'NO', status: MarketStatus) => {
    setActionLoading(true);
    try {
        await voteMerket(id, option, status);
        const updated = await getMerkets(); setMerkets(updated);
        if (selectedMerket?.id === id) setSelectedMerket(updated.find(m => m.id === id) || null);
    } catch (e) { console.error("Vote failed:", e); } finally { setActionLoading(false); }
  };

  const handleMarketUpdate = (updatedMarket: MerketType) => {
      setMerkets(prev => prev.map(m => m.id === updatedMarket.id ? updatedMarket : m));
      if (selectedMerket?.id === updatedMarket.id) {
          setSelectedMerket(updatedMarket);
      }
  };

  const sortedMerkets = useMemo(() => {
    const data = [...merkets];
    if (activeFilter === 'mcap') return data.filter(m => m.marketType === 'MCAP_TARGET').sort((a,b) => (b.status === 'OPEN' ? 1 : -1) - (a.status === 'OPEN' ? 1 : -1) || (b.expiresAt || 0) - (a.expiresAt || 0));
    const standardMarkets = data.filter(m => m.marketType !== 'MCAP_TARGET');
    switch (activeFilter) {
        case 'top': return standardMarkets.sort((a, b) => (b.yesVotes + b.noVotes) - (a.yesVotes + a.noVotes));
        case 'new': return standardMarkets.sort((a, b) => b.createdAt - a.createdAt);
        case 'trending': return standardMarkets.sort((a, b) => ((b.yesVotes + b.noVotes) * (Date.now() - b.createdAt < 86400000 ? 2 : 1)) - ((a.yesVotes + a.noVotes) * (Date.now() - a.createdAt < 86400000 ? 2 : 1)));
        default: return standardMarkets;
    }
  }, [merkets, activeFilter]);
  
  return (
    <section id="merkets">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-8 md:mb-12 pb-5 border-b border-slate-800">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-lg overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveFilter('top')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeFilter === 'top' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>Top</button>
                <button onClick={() => setActiveFilter('new')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeFilter === 'new' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>New</button>
                <button onClick={() => setActiveFilter('mcap')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeFilter === 'mcap' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>MCAP Targets</button>
                <button onClick={() => setActiveFilter('trending')} className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeFilter === 'trending' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-white'}`}>Trending</button>
            </div>
            <div className="ml-auto">
                <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 px-4 md:px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/20">
                    <Plus size={18} /> <span className="hidden md:inline">New Market</span><span className="md:hidden">New</span>
                </button>
            </div>
        </div>
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-blue-500" size={56} /><span className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Syncing Terminal...</span></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
            {sortedMerkets.map(m => <MerketCard key={m.id} merket={m} onOpen={target => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />)}
          </div>
        )}
      </div>
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} onMarketUpdate={handleMarketUpdate} />}
      {isCreateOpen && <CreateMarketModal onClose={()=>setIsCreateOpen(false)} onCreated={refreshMarkets} />}
    </section>
  );
};
export default PredictionMarket;