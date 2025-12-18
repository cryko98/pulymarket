
import React, { useEffect, useState, useRef } from 'react';
import { getMerkets, createMerket, voteMerket, hasUserVoted } from '../services/marketService';
import { PredictionMerket as MerketType } from '../types';
import { Plus, Users, Loader2, Camera, X, Info, ArrowUpRight, BarChart3, ChevronRight, Share2, Upload, ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- MOCK CHART COMPONENT ---
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
    <div className="absolute top-2 left-2 flex gap-2">
        <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
            <ArrowUpRight size={10} /> + Sentiment Momentum
        </span>
    </div>
  </div>
);

// --- DETAIL MODAL ---
const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  const alreadyVoted = hasUserVoted(merket.id);

  const downloadCard = async () => {
    if (!detailRef.current) return;
    try {
        const canvas = await html2canvas(detailRef.current, { 
          scale: 2, 
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true 
        });
        const link = document.createElement('a');
        link.download = `puly-merket-${merket.id.substring(0,4)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) { console.error("Image generation failed", e); }
  };

  const handleTweetAction = () => {
    if (selectedOption && !alreadyVoted) {
        onVote(merket.id, selectedOption);
    }

    // Trigger image download proof
    downloadCard();

    // Short link configuration using pulymerket.com domain
    const shortLink = `https://pulymerket.com/#m-${merket.id}`;
    
    const sentiment = selectedOption === 'YES' ? "BULLISH 🟢" : (selectedOption === 'NO' ? "BEARISH 🔴" : "WATCHING 🔮");
    
    // Updated text with $pulymerket ticker
    const tweetText = `Merket Check: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nMy Verdict: ${sentiment}\n\nJoin the merket:\n${shortLink}\n\n$pulymerket`;
    
    const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    // Open X in new tab
    window.open(xIntentUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl">
        <button 
          onClick={onClose} 
          className="absolute -top-12 md:-top-6 md:-right-6 z-[210] p-3 bg-white text-black border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          title="Close"
        >
          <X size={28} />
        </button>

        <div ref={detailRef} className="bg-white w-full rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border-4 border-black">
          <div className="flex-1 p-8 border-b md:border-b-0 md:border-r-4 border-black">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 border-4 border-black flex items-center justify-center overflow-hidden shrink-0">
                 <img src={merket.image || "https://pbs.twimg.com/media/G8bzt3JakAMwh2N?format=jpg&name=small"} className="w-full h-full object-cover" alt="Merket" />
              </div>
              <div className="text-black">
                <h2 className="text-3xl font-black leading-tight uppercase italic">{merket.question}</h2>
                <div className="flex items-center gap-3 mt-1 text-gray-500 font-bold text-sm">
                  <span className="flex items-center gap-1 text-black"><Users size={14}/> {totalVotes} members voted</span>
                  <span className="text-blue-600 font-black">{yesProb}% YES Confidence</span>
                </div>
              </div>
            </div>

            <MerketChart />

            <div className="space-y-4">
               <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-100">
                  <h4 className="font-black text-blue-600 text-xs uppercase mb-2 flex items-center gap-2">
                      <Info size={14} /> Merket Analysis
                  </h4>
                  <p className="text-black font-bold italic">"{merket.description}"</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                      <span className="block text-[10px] font-black text-gray-400 uppercase">Oracle Chance</span>
                      <span className="text-2xl font-black text-black">{yesProb}% YES</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                      <span className="block text-[10px] font-black text-gray-400 uppercase">Integrity Score</span>
                      <span className="text-2xl font-black text-green-500 uppercase italic">HIGH</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="w-full md:w-80 bg-gray-50 p-8 flex flex-col">
            <h3 className="font-black text-2xl uppercase italic tracking-tighter mb-8 text-black">VOTE MERKET</h3>
            
            <div className="flex flex-col gap-4 mb-8">
              <button 
                  onClick={() => setSelectedOption('YES')}
                  className={`w-full py-5 rounded-xl font-black transition-all border-4 ${selectedOption === 'YES' ? 'bg-green-500 text-white border-black scale-[1.02] shadow-lg' : 'bg-white text-green-600 border-gray-200 hover:border-green-300'}`}
              >
                  YES ({yesProb}%)
              </button>
              <button 
                  onClick={() => setSelectedOption('NO')}
                  className={`w-full py-5 rounded-xl font-black transition-all border-4 ${selectedOption === 'NO' ? 'bg-red-500 text-white border-black scale-[1.02] shadow-lg' : 'bg-white text-red-600 border-gray-200 hover:border-red-300'}`}
              >
                  NO ({100-yesProb}%)
              </button>
            </div>

            <button 
              disabled={(!selectedOption && !alreadyVoted) || isVoting}
              onClick={handleTweetAction}
              className="w-full bg-blue-600 text-white font-black py-5 rounded-full border-b-4 border-blue-900 shadow-xl hover:translate-y-0.5 transition-all flex flex-col items-center justify-center gap-1 group/btn"
            >
              {isVoting ? (
                  <Loader2 className="animate-spin text-white" />
              ) : (
                  <>
                      <div className="flex items-center gap-2">
                        <Share2 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                        TWEET MERKET
                      </div>
                      <span className="text-[10px] opacity-70 uppercase tracking-widest">Saves proof & Opens X</span>
                  </>
              )}
            </button>

            <div className="mt-auto pt-8">
              <button onClick={downloadCard} className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-colors">
                  <Camera size={14} /> Download Merket Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void; onVote: (id: string, option: 'YES' | 'NO') => void }> = ({ merket, onOpen, onVote }) => {
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesPercentage = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  const alreadyVoted = hasUserVoted(merket.id);

  return (
    <div 
      onClick={() => onOpen(merket)}
      className="bg-white border-4 border-black rounded-3xl p-6 shadow-2xl transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 cursor-pointer flex flex-col group"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl border-4 border-black bg-blue-600 overflow-hidden shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img src={merket.image || "https://pbs.twimg.com/media/G8bzt3JakAMwh2N?format=jpg&name=small"} className="w-full h-full object-cover" alt="Merket" />
        </div>
        <div className="flex-1">
            <h3 className="text-xl font-black text-black leading-tight uppercase italic mb-1">
              {merket.question}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Users size={12} /> {totalVotes} Community Votes
            </div>
        </div>
      </div>

      <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-black text-blue-600">{yesPercentage}% <span className="text-[10px] uppercase text-gray-400 tracking-widest">Yes</span></span>
            <span className="text-3xl font-black text-red-500">{100-yesPercentage}% <span className="text-[10px] uppercase text-gray-400 tracking-widest">No</span></span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border-2 border-black flex">
            <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${yesPercentage}%` }} />
            <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${100-yesPercentage}%` }} />
          </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            disabled={alreadyVoted}
            onClick={(e) => { e.stopPropagation(); onVote(merket.id, 'YES'); }}
            className="bg-green-100 text-green-700 font-black py-3 rounded-xl border-2 border-green-200 hover:border-green-500 hover:bg-green-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            YES
          </button>
          <button 
            disabled={alreadyVoted}
            onClick={(e) => { e.stopPropagation(); onVote(merket.id, 'NO'); }}
            className="bg-red-100 text-red-700 font-black py-3 rounded-xl border-2 border-red-200 hover:border-red-500 hover:bg-red-200 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            NO
          </button>
      </div>

      <div className="w-full py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-600 transition-all">
        Open Merket Detail <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
        reader.onloadend = () => setImgBase64(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => setImgBase64(reader.result as string);
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black w-full max-w-md rounded-3xl p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative" onPaste={handlePaste}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
                <h2 className="text-3xl font-black text-black mb-6 uppercase italic tracking-tighter">NEW MERKET</h2>
                
                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Question</label>
                        <textarea 
                            className="w-full bg-blue-50 border-4 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all resize-none"
                            rows={3}
                            placeholder="e.g. Will $pulymerket flip the cap by Monday?"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Merket Image (Upload or Paste)</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 border-4 border-black border-dashed rounded-2xl bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors relative overflow-hidden"
                        >
                            {imgBase64 ? (
                              <img src={imgBase64} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                              <>
                                <Upload size={32} className="text-blue-600 mb-2" />
                                <span className="text-[10px] font-black uppercase text-blue-600">Click to Upload or Paste Image</span>
                              </>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} disabled={isCreating} className="px-6 py-2 text-black font-black uppercase hover:underline">Abort</button>
                    <button 
                        disabled={!question.trim() || isCreating}
                        onClick={() => onSubmit(question, imgBase64 || '')} 
                        className="bg-blue-600 text-white font-black px-10 py-3 rounded-full hover:bg-blue-700 shadow-lg border-b-4 border-blue-900"
                    >
                        {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'LAUNCH MERKET'}
                    </button>
                </div>
            </div>
        </div>
    );
}

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
        const hash = window.location.hash;
        if (hash.startsWith('#m-')) {
            const merketId = hash.replace('#m-', '');
            const target = data.find(m => m.id === merketId);
            if (target) setSelectedMerket(target);
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    setActionLoading(true);
    await voteMerket(id, option); 
    const updated = await getMerkets();
    setMerkets(updated);
    const current = updated.find(m => m.id === id);
    if (current) setSelectedMerket(current);
    setActionLoading(false);
  };

  const handleCreate = async (q: string, img?: string) => {
    setActionLoading(true);
    await createMerket(q, img);
    await fetchData();
    setActionLoading(false);
    setIsCreateOpen(false);
  };

  const closeMerket = () => {
    setSelectedMerket(null);
    window.history.pushState(null, "", window.location.pathname + window.location.search);
  };

  return (
    <section className="py-24 bg-blue-600/20 backdrop-blur-sm" id="merkets">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
            <div className="text-center md:text-left">
                <h2 className="text-5xl md:text-7xl font-black text-white flex items-center gap-4 tracking-tighter text-outline italic uppercase mb-2">
                    <BarChart3 size={48} /> LIVE MERKETS
                </h2>
                <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs italic">
                    Free Community Merket Oracle v1.0
                </p>
            </div>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-3 bg-white text-blue-600 px-10 py-4 rounded-full shadow-2xl font-black text-xl border-b-4 border-gray-300 hover:scale-105 active:scale-95 transition-all">
                <Plus size={24} /> NEW MERKET
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="text-white animate-spin" size={64} /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {merkets.map(m => (
                    <MerketCard 
                        key={m.id} 
                        merket={m} 
                        onOpen={(target) => { 
                            setSelectedMerket(target);
                            window.location.hash = `m-${target.id}`; 
                        }} 
                        onVote={handleVote} 
                    />
                ))}
            </div>
        )}
      </div>

      <CreateMerketModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreate} isCreating={actionLoading} />
      {selectedMerket && (
        <MerketDetailModal 
            merket={selectedMerket} 
            onClose={closeMerket} 
            onVote={handleVote} 
            isVoting={actionLoading} 
        />
      )}
    </section>
  );
};

export default PredictionMerket;
