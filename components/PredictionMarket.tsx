import React, { useEffect, useState, useRef } from 'react';
import { getMerkets, createMerket, voteMerket, hasUserVoted } from '../services/marketService';
import { PredictionMerket as MerketType } from '../types';
import { Plus, Users, Loader2, X, BarChart3, ChevronRight, Share2, Upload } from 'lucide-react';

// Branding constants
const BRAND_LOGO = "https://pbs.twimg.com/media/G8b8OArXYAAkpHf?format=jpg&name=medium";

// Robust slugify for deep linking
const slugify = (text: string) => text
  .toLowerCase()
  .replace(/[^\w ]+/g, '')
  .replace(/ +/g, '-')
  .substring(0, 50);

const compressImage = (base64: string, maxWidth = 500, quality = 0.5): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(base64);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64);
    });
};

const MerketChart = () => (
  <div className="w-full h-48 relative overflow-hidden bg-blue-50/50 rounded-xl border border-blue-100 mb-6 group text-black">
    <svg className="w-full h-full" viewBox="0 0 400 200">
      <path 
        d="M0,150 Q50,140 100,160 T200,80 T300,120 T400,40" 
        fill="none" 
        stroke="#2563eb" 
        strokeWidth="4" 
        className="animate-[dash_3s_ease-in-out_infinite]"
        strokeDasharray="1000"
        strokeDashoffset="1000"
      />
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  </div>
);

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(null);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  const alreadyVoted = hasUserVoted(merket.id);

  const handleTweetAction = async () => {
    if (selectedOption && !alreadyVoted) {
        onVote(merket.id, selectedOption);
    }

    const slug = slugify(merket.question);
    const shortLink = `${window.location.origin}/#${slug}`;
    const sentiment = selectedOption === 'YES' ? "BULLISH 🟢" : (selectedOption === 'NO' ? "BEARISH 🔴" : "WATCHING 🔮");
    const tweetText = `Merket Check: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nMy Verdict: ${sentiment}\n\nJoin the merket:\n${shortLink}\n\n$pulymerket`;
    
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl">
        <button onClick={onClose} className="absolute -top-12 md:-top-6 md:-right-6 z-[210] p-3 bg-white text-black border-4 border-black rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
          <X size={28} />
        </button>

        <div className="bg-white w-full rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border-4 border-black">
          <div className="flex-1 p-8 border-b md:border-b-0 md:border-r-4 border-black text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 border-4 border-black flex items-center justify-center overflow-hidden shrink-0">
                 <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover" alt="Merket" />
              </div>
              <div className="text-black">
                <h2 className="text-3xl font-black leading-tight uppercase italic">{merket.question}</h2>
                <div className="flex items-center gap-3 mt-1 text-gray-500 font-bold text-sm">
                  <span className="flex items-center gap-1 text-black"><Users size={14}/> {totalVotes} members voted</span>
                </div>
              </div>
            </div>
            <MerketChart />
            <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
               <p className="text-black font-bold italic">"{merket.description}"</p>
            </div>
          </div>

          <div className="w-full md:w-80 bg-gray-50 p-8 flex flex-col">
            <h3 className="font-black text-2xl uppercase italic tracking-tighter mb-8 text-black">VOTE MERKET</h3>
            <div className="flex flex-col gap-4 mb-8">
              <button onClick={() => setSelectedOption('YES')} className={`w-full py-5 rounded-xl font-black transition-all border-4 ${selectedOption === 'YES' ? 'bg-green-500 text-white border-black scale-[1.02]' : 'bg-white text-green-600 border-gray-200'}`}>YES ({yesProb}%)</button>
              <button onClick={() => setSelectedOption('NO')} className={`w-full py-5 rounded-xl font-black transition-all border-4 ${selectedOption === 'NO' ? 'bg-red-500 text-white border-black scale-[1.02]' : 'bg-white text-red-600 border-gray-200'}`}>NO ({100-yesProb}%)</button>
            </div>
            <button disabled={(!selectedOption && !alreadyVoted) || isVoting} onClick={handleTweetAction} className="w-full bg-blue-600 text-white font-black py-5 rounded-full border-b-4 border-blue-900 shadow-xl flex items-center justify-center gap-2">
              {isVoting ? <Loader2 className="animate-spin" /> : <><Share2 size={20}/> TWEET VOTE</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesPercentage = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  return (
    <div onClick={() => onOpen(merket)} className="bg-white border-4 border-black rounded-3xl p-6 shadow-2xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col group h-full">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl border-4 border-black bg-blue-600 overflow-hidden shrink-0">
            <img src={merket.image || BRAND_LOGO} className="w-full h-full object-cover" alt="Merket" />
        </div>
        <div className="flex-1 text-left">
            <h3 className="text-xl font-black text-black leading-tight uppercase italic mb-1">{merket.question}</h3>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest"><Users size={12} className="inline mr-1" /> {totalVotes} Votes</div>
        </div>
      </div>
      <div className="mb-6 mt-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="text-2xl font-black text-blue-600">{yesPercentage}% YES</span>
            <span className="text-2xl font-black text-red-500">{100-yesPercentage}% NO</span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-black flex">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${yesPercentage}%` }} />
          </div>
      </div>
      <div className="w-full py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
        Open Details <ChevronRight size={14} />
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
                        {imgBase64 ? <img src={imgBase64} className="w-full h-full object-cover" /> : <Upload className="text-blue-600" />}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <button onClick={() => onSubmit(question, imgBase64 || '')} disabled={!question.trim() || isCreating} className="w-full bg-blue-600 text-white font-black px-10 py-4 rounded-full border-b-4 border-blue-900 flex items-center justify-center gap-3">
                    {isCreating ? <Loader2 className="animate-spin" /> : 'LAUNCH MERKET'}
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
        
        // DEEP LINK DETECTION: Check if hash matches any market slug
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const target = data.find(m => slugify(m.question) === hash || m.id === hash);
            if (target) setSelectedMerket(target);
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    // Listen for hash changes while the app is open
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

  const closeMerket = () => {
    setSelectedMerket(null);
    window.location.hash = ''; // Clear hash on close
  };

  const handleOpenMerket = (target: MerketType) => {
    setSelectedMerket(target);
    window.location.hash = slugify(target.question); // Set hash on open for URL sharing
  };

  return (
    <section id="merkets">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-black text-white flex items-center justify-center md:justify-start gap-4 tracking-tighter text-outline italic uppercase">
                <BarChart3 size={40} /> LIVE MERKETS
            </h2>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-3 bg-white text-blue-600 px-10 py-4 rounded-full shadow-xl font-black text-xl border-b-4 border-gray-300 hover:scale-105 active:scale-95 transition-all">
                <Plus size={24} /> NEW MERKET
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="text-white animate-spin" size={64} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {merkets.map(m => (
                    <MerketCard key={m.id} merket={m} onOpen={handleOpenMerket} />
                ))}
            </div>
        )}
      </div>

      <CreateMerketModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={async (q, i) => { setActionLoading(true); await createMerket(q, i); await fetchData(); setIsCreateOpen(false); setActionLoading(false); }} isCreating={actionLoading} />
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={closeMerket} onVote={handleVote} isVoting={actionLoading} />}
    </section>
  );
};

export default PredictionMerket;