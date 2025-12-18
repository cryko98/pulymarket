
import { PredictionMerket } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'puly_merket_data';
const USER_VOTES_KEY = 'puly_user_votes';

const FUNNY_INSIGHTS = [
  "Oracle status: High on digital incense.",
  "Whale alerted: Someone just bet their reputation on this.",
  "Merket sentiment: Pure hopium and 0.5% logic.",
  "Industry standard prediction. 97% of jeets will get this wrong.",
  "Data source: A dream the dev had after drinking 4 energy drinks.",
  "Confidence score: Trust me bro.",
  "Probability of moon: Highly likely if you don't sell your soul."
];

const SEED_DATA: PredictionMerket[] = [
  {
    id: 'puly-1',
    question: 'Will $pulymerket reach 100M Merket Cap by April?',
    yesVotes: 420,
    noVotes: 69,
    createdAt: Date.now(),
    image: 'https://pbs.twimg.com/media/G8bzt3JakAMwh2N?format=jpg&name=small',
    description: "The ultimate test of faith. If you believe, the chart will follow."
  }
];

export const hasUserVoted = (merketId: string): boolean => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : [];
    return votes.includes(merketId);
  } catch (e) {
    return false;
  }
};

const markUserAsVoted = (merketId: string) => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : [];
    if (!votes.includes(merketId)) {
      votes.push(merketId);
      localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
    }
  } catch (e) {
    console.error("Failed to save vote locally", e);
  }
};

export const getMerkets = async (): Promise<PredictionMerket[]> => {
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
      createdAt: new Date(item.created_at).getTime(),
      image: item.image,
      description: item.description || FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
    }));
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(stored);
};

export const createMerket = async (question: string, imageUrl?: string): Promise<void> => {
  const description = FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)];
  
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('markets')
      .insert([{ 
        question, 
        yes_votes: 0, 
        no_votes: 0, 
        image: imageUrl,
        description: description
      }]);
    
    if (error) console.error("Create error:", error);
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  const merkets = stored ? JSON.parse(stored) : SEED_DATA;
  const newMerket: PredictionMerket = {
    id: crypto.randomUUID(),
    question,
    yesVotes: 0,
    noVotes: 0,
    createdAt: Date.now(),
    image: imageUrl,
    description: description
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newMerket, ...merkets]));
};

export const voteMerket = async (id: string, option: 'YES' | 'NO'): Promise<void> => {
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
  const merkets = stored ? JSON.parse(stored) : SEED_DATA;
  const updated = merkets.map((m: any) => {
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
