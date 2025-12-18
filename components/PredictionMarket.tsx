
import React, { useEffect, useState } from 'react';
import { getMarkets, createMarket, voteMarket, hasUserVoted } from '../services/marketService';
import { PredictionMarket as MarketType } from '../types';
import { Plus, TrendingUp, Users, Loader2, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

const MarketCard: React.FC<{ market: MarketType; onVote: (id: string, option: 'YES' | 'NO') => Promise<void>; isVoting: boolean }> = ({ market, onVote, isVoting }) => {
  const totalVotes = market.yesVotes + market.noVotes;
  const yesPercentage = totalVotes === 0 ? 50 : Math.round((market.yesVotes / totalVotes) * 100);
  const noPercentage = 100 - yesPercentage;
  
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [localVoting, setLocalVoting] = useState(false);

  useEffect(() => {
    setAlreadyVoted(hasUserVoted(market.id));
  }, [market.id]);

  const handleVoteClick = async (option: 'YES' | 'NO') => {
      if (alreadyVoted) return;
      setLocalVoting(true);
      await onVote(market.id, option);
      setAlreadyVoted(true);
      setLocalVoting(false);
  };

  const isDisabled = isVoting || localVoting || alreadyVoted;

  return (
    <div className={`bg-white border-4 rounded-3xl p-6 shadow-2xl transition-all group relative overflow-hidden ${alreadyVoted ? 'border-blue-400 bg-blue-50' : 'border-black hover:border-blue-600 hover:-translate-y-1'}`}>
      
      <div className="mb-4">
        <h3 className="text-xl font-black text-black leading-tight group-hover:text-blue-600 transition-colors flex justify-between items-start gap-2 uppercase">
          {market.question}
          {alreadyVoted && <CheckCircle2 className="text-blue-600 shrink-0" size={24} />}
        </h3>
      </div>

      <div className="flex gap-3 mb-4">
        <button 
            disabled={isDisabled}
            onClick={() => handleVoteClick('YES')}
            className={`flex-1 rounded-xl py-3 px-2 flex flex-col items-center transition-all border-2 font-black
                ${alreadyVoted 
                    ? 'bg-gray-100 border-gray-200 text-gray-400' 
                    : 'bg-white hover:bg-blue-50 border-black text-black active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                }
            `}
        >
            <span className="text-xs mb-1">{alreadyVoted ? 'VOTED' : 'YES'}</span>
            <span className="text-xl">{yesPercentage}%</span>
        </button>
        <button 
            disabled={isDisabled}
            onClick={() => handleVoteClick('NO')}
            className={`flex-1 rounded-xl py-3 px-2 flex flex-col items-center transition-all border-2 font-black
                ${alreadyVoted 
                    ? 'bg-gray-100 border-gray-200 text-gray-400' 
                    : 'bg-white hover:bg-red-50 border-black text-black active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                }
            `}
        >
            <span className="text-xs mb-1">{alreadyVoted ? 'VOTED' : 'NO'}</span>
            <span className="text-xl">{noPercentage}%</span>
        </button>
      </div>

      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4 border-2 border-black">
        <div 
            className={`h-full rounded-full transition-all duration-1000 ${alreadyVoted ? 'bg-blue-600' : 'bg-blue-500'}`}
            style={{ width: `${yesPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-black font-black uppercase italic">
        <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{totalVotes} Voters</span>
        </div>
        <div>
            {alreadyVoted ? <span className="text-blue-600">CONFIRMED</span> : 'FREE'}
        </div>
      </div>
    </div>
  );
};

const CreateMarketModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (q: string) => void; isCreating: boolean }> = ({ isOpen, onClose, onSubmit, isCreating }) => {
    const [question, setQuestion] = useState('');
    const MAX_LENGTH = 100;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black w-full max-w-md rounded-3xl p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-3xl font-black text-black mb-1 uppercase italic">NEW PREDICTION</h2>
                <p className="text-gray-600 mb-6 font-bold">The market awaits your wisdom.</p>
                
                <div className="mb-6">
                    <textarea 
                        className="w-full bg-blue-50 border-4 border-black rounded-2xl p-4 text-black font-bold focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all placeholder:text-gray-400 resize-none"
                        rows={3}
                        placeholder="Ask the oracle... (e.g., Will $PULY reach $100M?)"
                        value={question}
                        maxLength={MAX_LENGTH}
                        onChange={(e) => setQuestion(e.target.value)}
                        disabled={isCreating}
                    />
                    <div className="flex justify-end mt-2">
                        <span className={`text-xs font-black ${question.length === MAX_LENGTH ? 'text-red-500' : 'text-black'}`}>
                            {question.length}/{MAX_LENGTH}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} disabled={isCreating} className="px-6 py-2 text-black font-black uppercase hover:underline transition-colors">Abort</button>
                    <button 
                        disabled={!question.trim() || isCreating}
                        onClick={() => {
                            onSubmit(question);
                            setQuestion('');
                        }} 
                        className="bg-blue-600 text-white font-black px-10 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 shadow-lg transition-all flex items-center gap-2 border-b-4 border-blue-900"
                    >
                        {isCreating && <Loader2 size={18} className="animate-spin" />}
                        {isCreating ? 'PROCESSING' : 'LAUNCH'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const PredictionMarket: React.FC = () => {
  const [markets, setMarkets] = useState<MarketType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
        const data = await getMarkets();
        setMarkets(data);
    } catch (e) {
        console.error("Failed to fetch markets", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVote = async (id: string, option: 'YES' | 'NO') => {
    try {
        setActionLoading(true);
        await voteMarket(id, option); 
        await fetchData();
    } catch (error) {
        console.error("Vote failed:", error);
    } finally {
        setActionLoading(false);
    }
  };

  const handleCreate = async (question: string) => {
    setActionLoading(true);
    await createMarket(question);
    await fetchData();
    setActionLoading(false);
    setIsModalOpen(false);
  };

  return (
    <section className="py-24 bg-blue-600/20 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 text-center md:text-left">
            <div>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-4 flex items-center justify-center md:justify-start gap-4 tracking-tighter text-outline italic">
                    <TrendingUp size={48} />
                    LIVE PULY MARKETS
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-3">
                    <p className="text-white text-2xl font-black drop-shadow-md uppercase italic">Vote or vanish. $pulymarket logic.</p>
                </div>
            </div>
            
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 bg-white text-blue-600 px-10 py-4 rounded-full transition-all shadow-2xl font-black text-xl border-b-4 border-gray-300 hover:scale-105 active:scale-95"
            >
                <Plus size={24} strokeWidth={3} />
                CREATE MARKET
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="text-white animate-spin" size={64} />
            </div>
        ) : markets.length === 0 ? (
            <div className="text-center py-32 bg-white/10 rounded-3xl border-4 border-dashed border-white/30">
                <p className="text-3xl text-white font-black uppercase italic mb-4">No markets found.</p>
                <p className="text-white/70 font-bold">Be the first to challenge the future!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {markets.map(market => (
                    <MarketCard 
                        key={market.id} 
                        market={market} 
                        onVote={handleVote} 
                        isVoting={actionLoading}
                    />
                ))}
            </div>
        )}

      </div>
      <CreateMarketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate}
        isCreating={actionLoading} 
      />
    </section>
  );
};

export default PredictionMarket;
