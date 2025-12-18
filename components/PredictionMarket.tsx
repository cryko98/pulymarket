
import React, { useEffect, useState, useRef } from 'react';
import { getMerkets, createMerket, voteMerket, hasUserVoted, getComments, postComment } from '../services/marketService';
import { PredictionMerket as MerketType, MerketComment } from '../types';
import { Plus, Users, Loader2, X, BarChart3, ChevronRight, Share2, Upload, MessageSquare, Send } from 'lucide-react';

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

const MerketChart = () => (
  <div className="w-full h-40 relative overflow-hidden bg-blue-50/50 rounded-xl border border-blue-100 mb-6 text-black">
    <svg className="w-full h-full" viewBox="0 0 400 200">
      <path d="M0,150 Q50,140 100,160 T200,80 T300,120 T400,40" fill="none" stroke="#2563eb" strokeWidth="4" className="animate-[dash_3s_ease-in-out_infinite]" strokeDasharray="1000" strokeDashoffset="1000" />
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </svg>
  </div>
);

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
    <div className="mt-8 pt-6 border-t-4 border-black/5">
      <h3 className="text-xl font-black uppercase italic mb-4 flex items-center gap-2 text-black">
        <MessageSquare size={20} className="text-blue-600" /> Comments ({comments.length})
      </h3>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-3 bg-blue-50/30 p-4 rounded-2xl border-2 border-dashed border-blue-200">
        <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Your handle..." 
              className="md:w-1/3 bg-white border-2 border-black/10 rounded-lg p-2 text-sm font-bold text-black focus:border-blue-500 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="flex-1 relative">
              <textarea 
                placeholder="Spit facts here..." 
                className="w-full bg-white border-2 border-black/10 rounded-xl p-3 text-sm font-bold text-black focus:border-blue-500 focus:outline-none h-12 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-1.5 p-2 bg-blue-600 text-white rounded-lg hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
        </div>
      </form>

      {/* INDEPENDENT SCROLL AREA FOR COMMENTS */}
      <div 
        ref={scrollRef}
        className="space-y-4 max-h-[400px] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent custom-scroll"
      >
        {comments.length === 0 ? (
          <div className="text-center py-10 opacity-30">
            <MessageSquare size={48} className="mx-auto mb-2" />
            <p className="text-black font-bold italic uppercase tracking-widest text-sm">Silence is bearish. Say something.</p>
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-white p-4 rounded-2xl border-2 border-black/5 shadow-sm transform transition-all hover:border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-xs text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">@{c.username}</span>
                <span className="text-[10px] text-gray-400 font-mono font-bold">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <p className="text-sm text-black font-bold leading-snug">{c.content}</p>
            </div>
          ))
        )}
      </div>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #2563eb; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(null);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  const alreadyVoted = hasUserVoted(merket.id);

  const handleTweetAction = async () => {
    if (selectedOption && !alreadyVoted) onVote(merket.id, selectedOption);
    const slug = slugify(merket.question);
    const shortLink = `${window.location.origin}/#${slug}`;
    const sentiment = selectedOption === 'YES' ? "BULLISH 🟢" : (selectedOption === 'NO' ? "BEARISH 🔴" : "WATCHING 🔮");
    const tweetText = `Merket Check: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nMy Verdict: ${sentiment}\n\nJoin the merket:\n${shortLink}\n\n$pulymerket`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 z-[210] p-3 bg-white text-black border-4 border-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
          <X size={28} />
        </button>

        <div className="bg-white w-full rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border-4 border-black h-full max-h-[85vh]">
          {/* LEFT SIDE: INFO, CHART & SCROLLABLE COMMENTS */}
          <div className="flex-1 p-8 overflow-y-auto custom-scroll border-b md:border-b-0 md:border-r-4 border-black text-left bg-white">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 border-4 border-black flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
                 <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover" alt="Merket" />
              </div>
              <div className="text-black">
                <h2 className="text-3xl md:text-5xl font-black leading-none uppercase italic tracking-tighter mb-2">{merket.question}</h2>
                <div className="flex items-center gap-4 text-gray-500 font-black text-xs uppercase tracking-widest">
                  <span className="flex items-center gap-1.5 text-black bg-gray-100 px-3 py-1 rounded-full"><Users size={16}/> {totalVotes} VOTERS</span>
                  <span className="flex items-center gap-1.5 text-blue-600"><BarChart3 size={16}/> TRENDING</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                <div className="space-y-6">
                    <MerketChart />
                    <div className="bg-blue-600 text-white p-6 rounded-3xl border-4 border-black shadow-lg transform -rotate-1">
                        <p className="text-xl font-black italic">"{merket.description}"</p>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
                    <CommentSection marketId={merket.id} />
                </div>
            </div>
          </div>

          {/* RIGHT SIDE: VOTING STICKY */}
          <div className="w-full md:w-80 bg-gray-100 p-8 flex flex-col justify-center border-t-4 md:border-t-0 border-black">
            <h3 className="font-black text-3xl uppercase italic tracking-tighter mb-10 text-black text-center">POSITION</h3>
            <div className="flex flex-col gap-6 mb-10">
              <div className="group relative">
                <button onClick={() => setSelectedOption('YES')} className={`w-full py-6 rounded-2xl font-black text-2xl transition-all border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${selectedOption === 'YES' ? 'bg-green-500 text-white border-black' : 'bg-white text-green-600 border-gray-200'}`}>YES ({yesProb}%)</button>
              </div>
              <div className="group relative">
                <button onClick={() => setSelectedOption('NO')} className={`w-full py-6 rounded-2xl font-black text-2xl transition-all border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${selectedOption === 'NO' ? 'bg-red-500 text-white border-black' : 'bg-white text-red-600 border-gray-200'}`}>NO ({100-yesProb}%)</button>
              </div>
            </div>
            
            <div className="mt-auto">
                <button 
                  disabled={(!selectedOption && !alreadyVoted) || isVoting} 
                  onClick={handleTweetAction} 
                  className="w-full bg-blue-600 text-white font-black py-6 rounded-full border-b-8 border-blue-900 shadow-2xl flex items-center justify-center gap-3 text-xl hover:scale-105 active:scale-95 transition-all"
                >
                  {isVoting ? <Loader2 className="animate-spin" /> : <><Share2 size={24}/> BROADCAST VOTE</>}
                </button>
                <p className="text-center text-[10px] font-black text-gray-400 mt-4 uppercase tracking-[0.2em]">Validated by PulyOracle</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const [commentCount, setCommentCount] = useState(0);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesPercentage = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  useEffect(() => {
    getComments(merket.id).then(c => setCommentCount(c.length));
  }, [merket.id]);

  return (
    <div onClick={() => onOpen(merket)} className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-2 hover:translate-x-1 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex flex-col group h-full relative overflow-hidden">
      
      {/* CARD DECORATION */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-600 rotate-45 border-4 border-black"></div>

      <div className="flex items-start gap-5 mb-8">
        <div className="w-16 h-16 rounded-2xl border-4 border-black bg-blue-600 overflow-hidden shrink-0 shadow-lg">
            <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover" alt="Merket" />
        </div>
        <div className="flex-1 text-left">
            <h3 className="text-2xl font-black text-black leading-tight uppercase italic mb-2 tracking-tighter group-hover:text-blue-600 transition-colors">{merket.question}</h3>
            <div className="flex gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Users size={12} /> {totalVotes} Votes</span>
              <span className="flex items-center gap-1 text-blue-500"><MessageSquare size={12} /> {commentCount} Comments</span>
            </div>
        </div>
      </div>
      
      <div className="mb-8 mt-auto">
          <div className="flex justify-between items-end mb-3">
            <div className="flex flex-col">
                <span className="text-xs font-black text-blue-800 uppercase">Bullish</span>
                <span className="text-3xl font-black text-blue-600">{yesPercentage}%</span>
            </div>
            <div className="flex flex-col text-right">
                <span className="text-xs font-black text-red-800 uppercase">Bearish</span>
                <span className="text-3xl font-black text-red-500">{100-yesPercentage}%</span>
            </div>
          </div>
          <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden border-4 border-black flex">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${yesPercentage}%` }} />
          </div>
      </div>
      
      <div className="w-full py-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition-all transform group-hover:scale-105">
        Open Merket Terminal <ChevronRight size={14} />
      </div>
    </div>
  );
};

const CreateMerketModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (q: string, img?: string) => void; isCreating: boolean }> = ({ isOpen, onClose, onSubmit, isCreating }) => {
    const [question, setQuestion] = useState('');
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
            <div className="bg-white border-4 border-black w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={24} /></button>
                <h2 className="text-3xl font-black text-black mb-6 uppercase italic tracking-tighter">NEW MERKET</h2>
                <div className="space-y-4 mb-8">
                    <textarea className="w-full bg-blue-50 border-4 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 focus:ring-blue-400" rows={3} placeholder="e.g. Will $puly reach 100M cap?" value={question} onChange={(e) => setQuestion(e.target.value)} disabled={isCreating} />
                    <div onClick={() => !isCreating && fileInputRef.current?.click()} className="w-full h-32 border-4 border-black border-dashed rounded-2xl bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 relative overflow-hidden">
                        {imgBase64 ? <img src={imgBase64} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center"><Upload className="text-blue-600 mb-2" /><span className="text-[10px] font-black uppercase text-gray-400">Add Cover Image</span></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <button onClick={() => onSubmit(question, imgBase64 || '')} disabled={!question.trim() || isCreating} className="w-full bg-blue-600 text-white font-black px-10 py-5 rounded-full border-b-8 border-blue-900 flex items-center justify-center gap-3 text-xl hover:scale-105 active:scale-95 transition-all">
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

  const fetchData = async () => {
    try {
        const data = await getMerkets();
        setMerkets(data);
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const target = data.find(m => slugify(m.question) === hash || m.id === hash);
            if (target) setSelectedMerket(target);
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const target = merkets.find(m => slugify(m.question) === hash || m.id === hash);
            if (target) setSelectedMerket(target);
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

  return (
    <section id="merkets">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 text-center md:text-left">
            <h2 className="text-5xl md:text-7xl font-black text-white flex items-center justify-center md:justify-start gap-5 tracking-tighter text-outline italic uppercase">
                <BarChart3 size={56} className="text-white" /> ACTIVE TERMINALS
            </h2>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-4 bg-white text-blue-600 px-12 py-5 rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] font-black text-2xl border-4 border-black hover:translate-y-1 hover:shadow-none transition-all">
                <Plus size={32} /> NEW MERKET
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="text-white animate-spin" size={64} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {merkets.map(m => (
                    <MerketCard key={m.id} merket={m} onOpen={(target) => { setSelectedMerket(target); window.location.hash = slugify(target.question); }} />
                ))}
            </div>
        )}
      </div>

      <CreateMerketModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={async (q, i) => { setActionLoading(true); await createMerket(q, i); await fetchData(); setIsCreateOpen(false); setActionLoading(false); }} isCreating={actionLoading} />
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = ''; }} onVote={handleVote} isVoting={actionLoading} />}
    </section>
  );
};

export default PredictionMerket;
