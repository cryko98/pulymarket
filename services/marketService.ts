import { PredictionMerket } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'puly_merket_data_v2';
const USER_VOTES_KEY = 'puly_user_votes_v2';
const BRAND_LOGO = "https://pbs.twimg.com/media/G8b8OArXYAAkpHf?format=jpg&name=medium";

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
    image: BRAND_LOGO,
    description: "The ultimate test of faith. If you believe, the chart will follow."
  }
];

export const hasUserVoted = (merketId: string): boolean => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : [];
    return Array.isArray(votes) && votes.includes(merketId);
  } catch (e) {
    return false;
  }
};

const markUserAsVoted = (merketId: string) => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : [];
    if (Array.isArray(votes) && !votes.includes(merketId)) {
      votes.push(merketId);
      localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
    } else if (!Array.isArray(votes)) {
      localStorage.setItem(USER_VOTES_KEY, JSON.stringify([merketId]));
    }
  } catch (e) {
    console.error("Failed to save vote locally", e);
  }
};

export const getMerkets = async (): Promise<PredictionMerket[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Explicitly select the 'image' and 'description' columns
      const { data, error } = await supabase
        .from('markets')
        .select('id, question, yes_votes, no_votes, created_at, image, description')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id.toString(),
          question: item.question,
          yesVotes: parseInt(item.yes_votes || 0),
          noVotes: parseInt(item.no_votes || 0),
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          image: item.image,
          description: item.description || FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
        }));
      } else if (error) {
        console.warn("Supabase fetch failed, falling back to local storage.", error.message);
      }
    } catch (err) {
      console.warn("Supabase connection error, falling back to local storage.");
    }
  }

  // Local Storage Fallback
  const stored = localStorage.getItem(STORAGE_KEY);
  let localData: PredictionMerket[] = [];
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) localData = parsed;
    } catch (e) { console.error(e); }
  }

  const seed = SEED_DATA[0];
  if (!localData.find(m => m.id === seed.id)) localData.push(seed);
  return localData.sort((a, b) => b.createdAt - a.createdAt);
};

export const createMerket = async (question: string, imageUrl?: string): Promise<void> => {
  if (!question.trim()) throw new Error("Question cannot be empty");

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('markets')
        .insert([{ 
          question: question.trim(), 
          yes_votes: 0, 
          no_votes: 0, 
          image: imageUrl,
          description: FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
        }]);
      
      if (error) {
        throw new Error(`Database error: ${error.message}. Did you run the SQL setup?`);
      }
      return;
    } catch (err: any) {
      if (err.message?.includes("Database error")) throw err;
      console.warn("Supabase insert failed, using local storage instead.");
    }
  }

  // Local Storage Path
  const stored = localStorage.getItem(STORAGE_KEY);
  let merkets = [];
  try {
      const parsed = stored ? JSON.parse(stored) : [];
      merkets = Array.isArray(parsed) ? parsed : [];
  } catch (e) { merkets = []; }

  const newMerket: PredictionMerket = {
    id: `local-${crypto.randomUUID()}`,
    question: question.trim(),
    yesVotes: 0,
    noVotes: 0,
    createdAt: Date.now(),
    image: imageUrl,
    description: FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
  };

  try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newMerket, ...merkets]));
  } catch (e) {
      throw new Error("Local storage full. Try a smaller image.");
  }
};

export const voteMerket = async (id: string, option: 'YES' | 'NO'): Promise<void> => {
  if (hasUserVoted(id)) return;

  if (isSupabaseConfigured() && supabase && !id.startsWith('local-')) {
    try {
      const { error: rpcError } = await supabase.rpc('increment_vote', { 
        market_id: id, 
        vote_type: option 
      });
      
      if (rpcError) {
        const { data: current } = await supabase.from('markets').select('id, yes_votes, no_votes').eq('id', id).single();
        if (current) {
          const updates = {
            yes_votes: option === 'YES' ? (current.yes_votes || 0) + 1 : (current.yes_votes || 0),
            no_votes: option === 'NO' ? (current.no_votes || 0) + 1 : (current.no_votes || 0),
          };
          await supabase.from('markets').update(updates).eq('id', id);
        }
      }
      markUserAsVoted(id);
      return;
    } catch (e) { console.error(e); }
  }

  // Local Storage Update
  const stored = localStorage.getItem(STORAGE_KEY);
  let merkets: any[] = [];
  try {
      const parsed = stored ? JSON.parse(stored) : [];
      merkets = Array.isArray(parsed) ? parsed : [];
  } catch (e) { merkets = []; }

  const updated = merkets.map((m: any) => {
    if (m.id === id) {
      return {
        ...m,
        yesVotes: option === 'YES' ? (m.yesVotes || 0) + 1 : m.yesVotes,
        noVotes: option === 'NO' ? (m.noVotes || 0) + 1 : m.noVotes,
      };
    }
    return m;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  markUserAsVoted(id);
};