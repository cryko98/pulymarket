import React, { useEffect, useState } from 'react';
import { getMerkets, voteMerket, getUserVote } from '../services/marketService';
import { PredictionMerket as MerketType } from '../types';
import { Loader2, X, Twitter } from 'lucide-react';

const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-').substring(0, 50);

const MerketChart: React.FC<{ yes: number; no: number }> = ({ yes, no }) => {
  const isBullish = yes > no;
  const color = isBullish ? '#22c55e' : '#ef4444';
  const pathData = isBullish 
    ? "M0,140 C50,150 100,180 150,100 C200,20 250,150 350,50 C370,30 390,40 400,20" 
    : "M0,60 C50,50 100,20 150,100 C200,180 250,50 350,150 C370,170 390,160 400,180";
  return (
    <div className={`w-full h-40 md:h-64 relative overflow-hidden rounded-3xl border-4 border-black mb-6 ${isBullish ? 'bg-green-50' : 'bg-red-50'}`}>
      <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path d={pathData} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const MerketDetailModal: React.FC<{ merket: MerketType; onClose: () => void; onVote: (id: string, option: 'YES' | 'NO') => void; isVoting: boolean }> = ({ merket, onClose, onVote, isVoting }) => {
  const currentVote = getUserVote(merket.id);
  const [selectedOption, setSelectedOption] = useState<'YES' | 'NO' | null>(currentVote);
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);

  const handleTweetAction = () => {
    const slug = slugify(merket.question);
    const domain = window.location.origin;
    const shareLink = `${domain}/${slug}`;
    const tweetText = `Market Signal: "${merket.question}"\n\nSentiment: ${yesProb}% YES\nJoin the terminal:\n${shareLink}\n\n$Polymarket`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] border-4 border-black overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-3 bg-white border-4 border-black rounded-full hover:scale-110"><X size={24} className="text-black" /></button>
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scroll border-r-4 border-black">
          <div className="flex items-center gap-6 mb-8">
            <img src={merket.image || BRAND_LOGO} className="w-24 h-24 rounded-3xl border-4 border-black object-cover shadow-xl" />
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-black">{merket.question}</h2>
          </div>
          <MerketChart yes={merket.yesVotes} no={merket.noVotes} />
          <p className="text-xl font-black italic text-black bg-blue-50 p-6 rounded-3xl border-4 border-black border-dashed mb-8">"{merket.description}"</p>
        </div>
        <div className="w-full md:w-80 bg-gray-100 p-8 flex flex-col justify-center gap-6">
          <button onClick={() => setSelectedOption('YES')} className={`w-full py-6 rounded-3xl font-black text-2xl border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${selectedOption === 'YES' ? 'bg-green-500 text-white' : 'bg-white text-green-600 border-gray-200'}`}>YES ({yesProb}%)</button>
          <button onClick={() => setSelectedOption('NO')} className={`w-full py-6 rounded-3xl font-black text-2xl border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${selectedOption === 'NO' ? 'bg-red-500 text-white' : 'bg-white text-red-600 border-gray-200'}`}>NO ({100-yesProb}%)</button>
          <button onClick={() => onVote(merket.id, selectedOption!)} disabled={!selectedOption || isVoting} className="w-full bg-black text-white font-black py-5 rounded-3xl border-b-8 border-gray-800 hover:scale-105 active:scale-95 transition-all disabled:opacity-30">CONFIRM POSITION</button>
          <button onClick={handleTweetAction} className="w-full bg-blue-600 text-white font-black py-5 rounded-full flex items-center justify-center gap-3 border-b-8 border-blue-900 shadow-lg"><Twitter size={20}/> SHARE SIGNAL</button>
        </div>
      </div>
    </div>
  );
};

const MerketCard: React.FC<{ merket: MerketType; onOpen: (m: MerketType) => void }> = ({ merket, onOpen }) => {
  const totalVotes = merket.yesVotes + merket.noVotes;
  const yesProb = totalVotes === 0 ? 50 : Math.round((merket.yesVotes / totalVotes) * 100);
  return (
    <div onClick={() => onOpen(merket)} className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col h-full group text-left">
      <div className="flex items-start gap-5 mb-8">
        <img src={merket.image || BRAND_LOGO} className="w-16 h-16 rounded-2xl border-4 border-black bg-blue-600 object-cover shadow-lg" />
        <h3 className="text-2xl font-black text-black leading-tight uppercase italic group-hover:text-blue-600 transition-colors">{merket.question}</h3>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between font-black text-xs uppercase mb-2">
          <span className="text-blue-600">YES {yesProb}%</span>
          <span className="text-red-600">NO {100-yesProb}%</span>
        </div>
        <div className="h-6 bg-gray-100 border-4 border-black rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-600" style={{ width: `${yesProb}%` }} />
        </div>
        <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
           <span>{totalVotes} VOTES</span>
           <span className="bg-gray-100 px-3 py-1 rounded-md text-black border-2 border-black group-hover:bg-blue-600 group-hover:text-white transition-colors">Open Terminal →</span>
        </div>
      </div>
    </div>
  );
};

const PredictionMerket: React.FC = () => {
  const [merkets, setMerkets] = useState<MerketType[]>([]);
  const [selectedMerket, setSelectedMerket] = useState<MerketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
        <h2 className="text-5xl md:text-8xl font-black text-white text-outline italic uppercase mb-16 text-center tracking-tighter">LIVE TERMINALS</h2>
        {loading ? <div className="flex justify-center"><Loader2 className="animate-spin text-white" size={64} /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {merkets.map(m => <MerketCard key={m.id} merket={m} onOpen={target => { setSelectedMerket(target); window.location.hash = `live-market:${slugify(target.question)}`; }} />)}
          </div>
        )}
      </div>
      {selectedMerket && <MerketDetailModal merket={selectedMerket} onClose={() => { setSelectedMerket(null); window.location.hash = 'live-market'; }} onVote={handleVote} isVoting={actionLoading} />}
    </section>
  );
};

export default PredictionMerket;