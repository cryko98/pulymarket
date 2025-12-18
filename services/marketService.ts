
import { PredictionMerket } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'puly_merket_data_v2';
const USER_VOTES_KEY = 'puly_user_votes_v2';

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
    // We select only known core columns to avoid schema cache issues with 'description'
    const { data, error } = await supabase
      .from('markets')
      .select('id, question, yes_votes, no_votes, created_at, image')
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
      // Fallback to funny insights locally to avoid needing the DB column
      description: item.description || FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
    }));
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return SEED_DATA;
  }
  try {
    const parsed = JSON.parse(stored);
    const merged = [...parsed];
    if (!merged.find(m => m.id === 'puly-1')) merged.push(SEED_DATA[0]);
    return merged;
  } catch (e) {
    return SEED_DATA;
  }
};

export const createMerket = async (question: string, imageUrl?: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    // Removed 'description' from insert to ensure it works with standard tables
    const { error } = await supabase
      .from('markets')
      .insert([{ 
        question, 
        yes_votes: 0, 
        no_votes: 0, 
        image: imageUrl
      }]);
    
    if (error) {
      console.error("Supabase Insert Error:", error);
      throw new Error(error.message);
    }
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  let merkets = [];
  try {
      merkets = stored ? JSON.parse(stored) : [];
  } catch (e) {
      merkets = [];
  }

  const newMerket: PredictionMerket = {
    id: crypto.randomUUID(),
    question,
    yesVotes: 0,
    noVotes: 0,
    createdAt: Date.now(),
    image: imageUrl,
    description: FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
  };

  try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newMerket, ...merkets]));
  } catch (e) {
      console.error("Storage error", e);
      throw new Error("Image too large or storage full! Try a smaller image.");
  }
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
        const { data: current } = await supabase.from('markets').select('id, yes_votes, no_votes').eq('id', id).single();
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
  let merkets = [];
  try {
      merkets = stored ? JSON.parse(stored) : SEED_DATA;
  } catch (e) {
      merkets = SEED_DATA;
  }

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
