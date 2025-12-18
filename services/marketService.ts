
import { PredictionMerket, MerketComment } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'puly_merket_data_v2';
const COMMENTS_KEY = 'puly_merket_comments_v1';
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
      }
    } catch (err) { console.error(err); }
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  let localData: PredictionMerket[] = stored ? JSON.parse(stored) : [];
  if (!localData.find(m => m.id === SEED_DATA[0].id)) localData.push(SEED_DATA[0]);
  return localData.sort((a, b) => b.createdAt - a.createdAt);
};

export const createMerket = async (question: string, imageUrl?: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('markets').insert([{ 
      question: question.trim(), 
      yes_votes: 0, 
      no_votes: 0, 
      image: imageUrl,
      description: FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)]
    }]);
    return;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  const merkets = stored ? JSON.parse(stored) : [];
  const newMerket = { id: `local-${crypto.randomUUID()}`, question, yesVotes: 0, noVotes: 0, createdAt: Date.now(), image: imageUrl, description: "Local Merket" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newMerket, ...merkets]));
};

export const voteMerket = async (id: string, option: 'YES' | 'NO'): Promise<void> => {
  if (hasUserVoted(id)) return;
  if (isSupabaseConfigured() && supabase && !id.startsWith('local-')) {
    await supabase.rpc('increment_vote', { market_id: id, vote_type: option });
    markUserAsVoted(id);
    return;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  const merkets = stored ? JSON.parse(stored) : [];
  const updated = merkets.map((m: any) => m.id === id ? { ...m, yesVotes: option === 'YES' ? m.yesVotes + 1 : m.yesVotes, noVotes: option === 'NO' ? m.noVotes + 1 : m.noVotes } : m);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  markUserAsVoted(id);
};

// --- NEW COMMENT SERVICES ---

export const getComments = async (marketId: string): Promise<MerketComment[]> => {
  if (isSupabaseConfigured() && supabase && !marketId.startsWith('local-')) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const stored = localStorage.getItem(COMMENTS_KEY);
  const allComments: MerketComment[] = stored ? JSON.parse(stored) : [];
  return allComments.filter(c => c.market_id === marketId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const postComment = async (marketId: string, username: string, content: string): Promise<void> => {
  if (!username.trim() || !content.trim()) return;
  if (isSupabaseConfigured() && supabase && !marketId.startsWith('local-')) {
    await supabase.from('comments').insert([{ market_id: marketId, username, content }]);
    return;
  }
  const stored = localStorage.getItem(COMMENTS_KEY);
  const allComments = stored ? JSON.parse(stored) : [];
  const newComment = { id: crypto.randomUUID(), market_id: marketId, username, content, created_at: new Date().toISOString() };
  localStorage.setItem(COMMENTS_KEY, JSON.stringify([newComment, ...allComments]));
};
