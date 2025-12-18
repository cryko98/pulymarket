
import { PredictionMarket } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'puly_merket_data';
const USER_VOTES_KEY = 'puly_user_votes';

const SEED_DATA: PredictionMarket[] = [
  {
    id: 'puly-1',
    question: 'Will $pulymerket reach 100M Market Cap by April?',
    yesVotes: 420,
    noVotes: 69,
    totalVolume: 50000,
    createdAt: Date.now(),
  }
];

export const hasUserVoted = (marketId: string): boolean => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : [];
    return votes.includes(marketId);
  } catch (e) {
    return false;
  }
};

const markUserAsVoted = (marketId: string) => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : [];
    if (!votes.includes(marketId)) {
      votes.push(marketId);
      localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
    }
  } catch (e) {
    console.error("Failed to save vote locally", e);
  }
};

export const getMarkets = async (): Promise<PredictionMarket[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase error:", error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      question: item.question,
      yesVotes: parseInt(item.yes_votes || 0),
      noVotes: parseInt(item.no_votes || 0),
      totalVolume: parseFloat(item.total_volume || 0),
      createdAt: new Date(item.created_at).getTime(),
    }));
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(stored);
};

export const createMarket = async (question: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('markets')
      .insert([{ 
        question, 
        yes_votes: 0, 
        no_votes: 0, 
        total_volume: 0 
      }]);
    
    if (error) console.error("Create error:", error);
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  const markets = stored ? JSON.parse(stored) : SEED_DATA;
  const newMarket: PredictionMarket = {
    id: crypto.randomUUID(),
    question,
    yesVotes: 0,
    noVotes: 0,
    totalVolume: 0,
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newMarket, ...markets]));
};

export const voteMarket = async (id: string, option: 'YES' | 'NO'): Promise<void> => {
  if (hasUserVoted(id)) return;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error: rpcError } = await supabase.rpc('increment_vote', { 
        market_id: id, 
        vote_type: option 
      });
      
      if (rpcError) {
        const { data: current } = await supabase.from('markets').select('*').eq('id', id).single();
        if (current) {
          const updates = {
            yes_votes: option === 'YES' ? current.yes_votes + 1 : current.yes_votes,
            no_votes: option === 'NO' ? current.no_votes + 1 : current.no_votes,
          };
          await supabase.from('markets').update(updates).eq('id', id);
        }
      }
      markUserAsVoted(id);
    } catch (e) {
      console.error("Vote failed", e);
    }
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  const markets = stored ? JSON.parse(stored) : SEED_DATA;
  const updated = markets.map((m: any) => {
    if (m.id === id) {
      return {
        ...m,
        yesVotes: option === 'YES' ? m.yesVotes + 1 : m.yesVotes,
        noVotes: option === 'NO' ? m.noVotes + 1 : m.noVotes,
      };
    }
    return m;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  markUserAsVoted(id);
};
