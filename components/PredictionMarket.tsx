
import React, { useEffect, useState, useRef } from 'react';
import { getMerkets, createMerket, voteMerket, getUserVote, getComments, postComment } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Plus, Loader2, X, BarChart3, ChevronRight, Share2, Upload, MessageSquare, Send, Twitter, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import html2canvas from 'html2canvas';

const BRAND_LOGO = "https://pbs.twimg.com/media/G8b8OArXYAAkpHf?format=jpg&name=medium";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const compressImage = (base64: string, maxWidth = 500, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
  });
};

const MerketChart: React.FC<{ yes: number; no: number }> = ({ yes, no }) => {
  const isBullish = yes > no;
  const isBearish = no > yes;
  const color = isBullish ? '#22c55e' : (isBearish ? '#ef4444' : '#3b82f6');
  
  const pathData = isBullish 
    ? "M0,140 C50,150 100,180 150,100 C200,20 250,150 350,50 C370,30 390,40 400,20" 
    : isBearish 
    ? "M0,60 C50,50 100,20 150,100 C200,180 250,50 350,150 C370,170 390,160 400,180"
    : "M0,100 C100,90 300,110 400,100";

  return (
    <div className={`w-full h-40 md:h-64 relative overflow-hidden rounded-3xl border-4 border-black mb-6 transition-colors duration-500 shadow-inner ${isBullish ? 'bg-green-50' : isBearish ? 'bg-red-50' : 'bg-blue-50'}`}>
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path 
          d={pathData} 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          className="animate-[dash_1.5s_ease-out_forwards]" 
          strokeDasharray="1000" 
          strokeDashoffset="1000" 
          strokeLinecap="round"
        />
        <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
      </svg>
      <div className="absolute top-4 right-6 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full animate-pulse ${isBullish ? 'bg-green-500' : isBearish ? 'bg-red-500' : 'bg-blue-500'}`}></div>
        <span className="text-xs font-black uppercase tracking-widest text-black/40">Live Terminal Feedback</span>
      </div>
    </div>
  );
};

const CommentSection: React.FC<{ marketId: string }> = ({ marketId }) => {
  const [comments, setComments] = useState<MerketComment[]>([]);
  const [username, setUsername] = useState(localStorage.getItem('puly_username') || '');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      const data = await getComments(marketId);
      setComments(data);
    };
    fetchComments();
  }, [marketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !username.trim()) return;
    setLoading(true);
    localStorage.setItem('puly_username', username);
    await postComment(marketId, username, content);
    const updated = await getComments(marketId);
    setComments(updated);
    setContent('');
    setLoading(false);
  };

  return (
    <div className="mt-8 pt-8 border-t-4 border-black/5">
      <h3 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3 text-black text-left">
        <MessageSquare size={24} className="text-blue-600" /> COMMUNITY FEED ({comments.length})
      </h3>
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-blue-50/50 p-6 rounded-3xl border-4 border-black border-dashed">
        <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Your handle..." 
              className="md:w-1/4 bg-white border-4 border-black rounded-xl p-3 text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-blue-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="flex-1 relative">
              <textarea 
                placeholder="Share your prediction insight..." 
                className="w-full bg-white border-4 border-black rounded-xl p-3 pr-14 text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-blue-400 h-14 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
        </div>
      </form>

      <div 
        ref={scrollRef}
        className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scroll"
      >
        {comments.length === 0 ? (
          <div className="text-center py-16 opacity-30 border-2 border-dashed border-black/10 rounded-3xl">
            <MessageSquare size={64} className="mx-auto mb-4" />
            <p className="text-black font-bold italic uppercase tracking-widest text-lg">No signals detected yet.</p>
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-sm text-blue-600 uppercase tracking-tighter bg-blue-50 px-3 py-1 rounded-lg">@{c.username}</span>
                <span className="text-xs text-gray-400 font-mono font-bold">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-base text-black font-bold leading-relaxed text-left">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const handleVoteSubmit = async () => {
    if (!selectedOption || selectedOption === currentVote) return;
    await onVote(merket.id, selectedOption);
  };

  const handleTweetAction = async () => {
    setIsCapturing(true);
    
    if (captureRef.current) {
        try {
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore'),
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `pulymerket-${slugify(merket.question)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to capture image", err);
        }
    }

    const slug = slugify(merket.question);
    const shortLink = `${window.location.origin}/#live-market:${slug}`;
    const sentiment = currentVote === 'YES' ? "BULLISH 🟢" : (currentVote === 'NO' ? "BEARISH 🔴" : "WATCHING 🔮");
    const tweetText = `Merket Check: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nMy Verdict: ${sentiment}\n\nJoin the merket:\n${shortLink}\n\n$pulymerket`;
    
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
    setIsCapturing(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-7xl h-full max-h-[95vh] md:max-h-[92vh] overflow-hidden">
        <button data-html2canvas-ignore onClick={onClose} className="absolute top-2 right-2 md:top-6 md:right-6 z-[210] p-2 md:p-3 bg-white text-black border-4 border-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
          <X size={28} />
        </button>

        <div className="bg-white w-full h-full rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl flex border-4 border-black">
          <div ref={captureRef} className="flex-1 flex flex-col md:flex-row bg-white min-h-0 w-full overflow-hidden">
            
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scroll border-b md:border-b-0 md:border-r-4 border-black p-6 md:p-12">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-10 mb-8 md:mb-12 text-center sm:text-left">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl bg-blue-600 border-4 border-black flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                     <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover" alt="Merket" />
                  </div>
                  <div className="text-black flex-1">
                    <h2 className="text-3xl md:text-5xl font-black leading-tight uppercase italic tracking-tighter mb-4">{merket.question}</h2>
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-gray-500 font-black text-xs md:text-sm uppercase tracking-widest">
                      <span className="flex items-center gap-2 text-black bg-gray-100 px-4 py-1.5 rounded-full border-2 border-black/5"><CheckCircle2 size={18}/> {totalVotes} VOTES REGISTERED</span>
                      <span className="flex items-center gap-2 text-blue-600"><BarChart3 size={18}/> PULY ORACLE VERIFIED</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8 md:space-y-12">
                    <div className="w-full">
                        <h4 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-[0.2em]">Live Volatility Index</h4>
                        <MerketChart yes={merket.yesVotes} no={merket.noVotes} />
                    </div>
                    
                    <div className="w-full bg-blue-600 text-white p-8 md:p-12 rounded-[2.5rem] border-4 border-black shadow-xl transform -rotate-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                            <BarChart3 size={120} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-blue-200 mb-3 tracking-[0.2em]">Analyst Insight</h4>
                        <p className="text-xl md:text-3xl font-black italic leading-tight">"{merket.description}"</p>
                    </div>
                    
                    <div data-html2canvas-ignore className="w-full bg-gray-50 p-6 md:p-10 rounded-[3rem] border-4 border-black border-dashed">
                        <CommentSection marketId={merket.id} />
                    </div>
                </div>
            </div>

            <div className="w-full md:w-96 bg-gray-100 p-8 md:p-12 flex flex-col justify-center shrink-0">
                <h3 className="font-black text-3xl md:text-4xl uppercase italic tracking-tighter mb-8 text-black text-center">OPEN POSITION</h3>
                
                <div className="flex md:flex-col gap-4 mb-8">
                  <button 
                    onClick={() => setSelectedOption('YES')} 
                    className={`flex-1 md:w-full py-6 rounded-3xl font-black text-2xl md:text-3xl transition-all border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center justify-center gap-3 ${selectedOption === 'YES' ? 'bg-green-500 text-white border-black' : 'bg-white text-green-600 border-gray-200'}`}
                  >
                    YES ({yesProb}%)
                  </button>
                  <button 
                    onClick={() => setSelectedOption('NO')} 
                    className={`flex-1 md:w-full py-6 rounded-3xl font-black text-2xl md:text-3xl transition-all border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center justify-center gap-3 ${selectedOption === 'NO' ? 'bg-red-500 text-white border-black' : 'bg-white text-red-600 border-gray-200'}`}
                  >
                    NO ({100-yesProb}%)
                  </button>
                </div>

                <button 
                  disabled={!selectedOption || selectedOption === currentVote || isVoting}
                  onClick={handleVoteSubmit}
                  className="w-full bg-black text-white font-black py-5 rounded-3xl border-b-8 border-gray-800 shadow-2xl mb-6 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-3 text-xl"
                >
                  {isVoting ? <Loader2 className="animate-spin" /> : 'CONFIRM POSITION'}
                </button>
                
                <div className="mt-6 pt-8 border-t-4 border-dashed border-gray-300">
                    <div data-html2canvas-ignore>
                        <button 
                          disabled={!currentVote || isCapturing} 
                          onClick={handleTweetAction} 
                          className="w-full bg-blue-600 text-white font-black py-5 rounded-full border-b-8 border-blue-900 shadow-2xl flex items-center justify-center gap-3 text-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 mb-6"
                        >
                          {isCapturing ? (
                            <><Loader2 className="animate-spin" /> BROADCASTING...</>
                          ) : (
                            <><Twitter size={24}/> TWEET SIGNAL</>
                          )}
                        </button>
                    </div>
                    <div className="flex justify-between items-center px-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Network: Solana</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode: Live</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const [commentCount, setCommentCount] = useState(0);
  const currentVote = getUserVote(merket.id);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesPercentage = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  useEffect(() => {
    getComments(merket.id).then(c => setCommentCount(c.length));
  }, [merket.id]);

  return (
    <div onClick={() => onOpen(merket)} className="bg-white border-4 border-black rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 hover:translate-x-1 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex flex-col group h-full relative overflow-hidden text-left">
      
      <div className={`absolute -top-6 -right-6 w-16 h-16 md:w-20 md:h-20 rotate-45 border-4 border-black transition-colors ${currentVote === 'YES' ? 'bg-green-500' : currentVote === 'NO' ? 'bg-red-500' : 'bg-blue-600'}`}></div>

      <div className="flex items-start gap-4 md:gap-5 mb-6 md:mb-8 pr-6">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-4 border-black bg-blue-600 overflow-hidden shrink-0 shadow-lg">
            <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover" alt="Merket" />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-lg md:text-2xl font-black text-black leading-tight uppercase italic mb-1 md:mb-2 tracking-tighter group-hover:text-blue-600 transition-colors truncate sm:whitespace-normal">{merket.question}</h3>
            <div className="flex flex-wrap gap-2 md:gap-4 text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><CheckCircle2 size={10} /> {totalVotes} VOTES</span>
              <span className="flex items-center gap-1 text-blue-500"><MessageSquare size={10} /> {commentCount}</span>
              {currentVote && (
                <span className={`px-2 rounded-md text-white whitespace-nowrap ${currentVote === 'YES' ? 'bg-green-500' : 'bg-red-500'}`}>
                    VOTED: {currentVote}
                </span>
              )}
            </div>
        </div>
      </div>
      
      <div className="mb-6 md:mb-8 mt-auto">
          <div className="flex justify-between items-end mb-2 md:mb-3">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-800 uppercase">Bullish</span>
                <span className="text-2xl md:text-3xl font-black text-blue-600">{yesPercentage}%</span>
            </div>
            <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-red-800 uppercase">Bearish</span>
                <span className="text-2xl md:text-3xl font-black text-red-500">{100-yesPercentage}%</span>
            </div>
          </div>
          <div className="w-full h-4 md:h-6 bg-gray-100 rounded-full overflow-hidden border-2 md:border-4 border-black flex">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${yesPercentage}%` }} />
          </div>
      </div>
      
      <div className="w-full py-3 md:py-4 bg-gray-50 rounded-xl md:rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition-all transform group-hover:scale-105">
        Open Terminal <ChevronRight size={14} />
      </div>
    </div>
  );
};

const CreateMerketModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (q: string, d: string, img?: string) => void; isCreating: boolean }> = ({ isOpen, onClose, onSubmit, isCreating }) => {
    const [question, setQuestion] = useState('');
    const [description, setDescription] = useState('');
    const [imgBase64, setImgBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => setImgBase64(await compressImage(reader.result as string, 500, 0.5));
        reader.readAsDataURL(file);
      }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={24} /></button>
                <h2 className="text-2xl md:text-3xl font-black text-black mb-6 uppercase italic tracking-tighter">NEW MERKET</h2>
                <div className="space-y-4 mb-6 md:mb-8">
                    <div>
                      <label className="text-[10px] font-black uppercase text-blue-600 mb-1 block text-left">The Question</label>
                      <textarea className="w-full bg-blue-50 border-4 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 focus:ring-blue-400 h-20 md:h-24 resize-none" placeholder="e.g. Will $puly reach 100M cap?" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={isCreating} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-blue-600 mb-1 block text-left">Merket Insight (Description)</label>
                      <textarea className="w-full bg-gray-50 border-2 border-black/10 rounded-xl p-3 text-black font-bold focus:outline-none focus:border-blue-500 h-16 md:h-20 resize-none text-sm" placeholder="Why should people care? (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isCreating} />
                    </div>
                    <div onClick={() => !isCreating && fileInputRef.current?.click()} className="w-full h-24 md:h-32 border-4 border-black border-dashed rounded-2xl bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 relative overflow-hidden">
                        {imgBase64 ? <img src={imgBase64} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center"><Upload className="text-blue-600 mb-2" /><span className="text-[10px] font-black uppercase text-gray-400">Add Cover Image</span></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <button onClick={() => onSubmit(question, description, imgBase64 || '')} disabled={!question.trim() || isCreating} className="w-full bg-blue-600 text-white font-black px-6 py-4 md:py-5 rounded-full border-b-8 border-blue-900 flex items-center justify-center gap-3 text-lg md:text-xl hover:scale-105 active:scale-95 transition-all">
                    {isCreating ? <Loader2 className="animate-spin" /> : 'DEPLOY MERKET'}
                </button>
            </div>
        </div>
    );
};

const PredictionMerket: React.FC = () => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'trending'>('trending');

  const fetchData = async () => {
    try {
        const data = await getMerkets();
        setMerkets(data);
        
        const hash = window.location.hash;
        if (hash.includes(':')) {
            const slug = hash.split(':')[1];
            if (slug) {
                const target = data.find(m => slugify(m.question) === slug || m.id === slug);
                if (target) setSelectedMerket(target);
            }
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash.includes(':')) {
            const slug = hash.split(':')[1];
            const target = merkets.find(m => slugify(m.question) === slug || m.id === slug);
            if (target) setSelectedMerket(target);
        } else if (hash === '#live-market') {
            setSelectedMerket(null);
        }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [merkets.length]);

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
        await voteMerket(id, option); 
        const updated = await getMerkets();
        setMerkets(updated);
        const current = updated.find(m => m.id === id);
        if (current) setSelectedMerket(current);
    } catch (e) { console.error(e); }
    setActionLoading(false);
  };

  const sortedMerkets = [...merkets].sort((a, b) => {
    if (sortBy === 'trending') {
        return (b.yesVotes + b.noVotes) - (a.yesVotes + a.noVotes);
    }
    return b.createdAt - a.createdAt;
  });

  return (
    <section id="merkets">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-16 gap-6 text-center md:text-left">
            <h2 className="text-4xl md:text-7xl font-black text-white flex items-center justify-center md:justify-start gap-4 md:gap-5 tracking-tighter text-outline italic uppercase">
                <BarChart3 size={40} className="text-white md:w-14 md:h-14" /> ACTIVE TERMINALS
            </h2>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-3 md:gap-4 bg-white text-blue-600 px-8 md:px-12 py-4 md:py-5 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] font-black text-xl md:text-2xl border-4 border-black hover:translate-y-1 hover:shadow-none transition-all">
                <Plus size={24} className="md:w-8 md:h-8" /> NEW MERKET
            </button>
        </div>

        <div className="flex items-center gap-2 mb-8 bg-black/20 p-1.5 rounded-2xl w-fit mx-auto md:mx-0 border-4 border-black">
            <button 
                onClick={() => setSortBy('trending')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${sortBy === 'trending' ? 'bg-white text-blue-600 shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
                <TrendingUp size={18} /> Trending
            </button>
            <button 
                onClick={() => setSortBy('recent')}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${sortBy === 'recent' ? 'bg-white text-blue-600 shadow-xl' : 'text-white/60 hover:text-white'}`}
            >
                <Clock size={18} /> Newest
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="text-white animate-spin" size={64} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                {sortedMerkets.map(m => (
                    <MerketCard key={m.id} merket={m} onOpen={(target) => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />
                ))}
            </div>
        )}
      </div>

      <CreateMerketModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={async (q, d, i) => { setActionLoading(true); await createMerket(q, d, i); await fetchData(); setIsCreateOpen(false); setActionLoading(false); }} isCreating={actionLoading} />
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} />}
    </section>
  );
};

export default PredictionMerket;
