
import { PredictionMerket, MerketComment } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'poly_market_data_v3';
const COMMENTS_KEY = 'poly_market_comments_v1';
const USER_VOTES_KEY = 'poly_user_votes_v3'; 
const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

const FUNNY_INSIGHTS = [
  "Confidence scoring: High.",
  "Market sentiment: Extremely Bullish.",
  "Terminal activity: Peak volume.",
  "Industry report: $Polymarket dominance.",
  "Data source: On-chain truth.",
  "Accuracy: Verified by Oracle.",
  "Signal status: Strong Buy pressure."
];

export const fetchMarketCap = async (ca: string): Promise<string | null> => {
  if (!ca || ca.length < 32) return null;
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const mcap = data.pairs[0].fdv || data.pairs[0].marketCap;
      if (mcap >= 1000000) return `${(mcap / 1000000).toFixed(2)}M`;
      if (mcap >= 1000) return `${(mcap / 1000).toFixed(1)}K`;
      return `${mcap}`;
    }
    return "N/A";
  } catch (err) {
    return null;
  }
};

export const getUserVote = (merketId: string): 'YES' | 'NO' | null => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : {};
    return votes[merketId] || null;
  } catch (e) {
    return null;
  }
};

const saveUserVote = (merketId: string, option: 'YES' | 'NO') => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : {};
    votes[merketId] = option;
    localStorage.setItem(USER_VOTES_KEY, JSON.stringify(votes));
  } catch (e) {
    console.error("Failed to save vote locally", e);
  }
};

export const getMerkets = async (): Promise<PredictionMerket[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase Database Error (Fetch):", error.message, error.details);
      } else if (data) {
        return data.map((item: any) => ({
          id: item.id.toString(),
          question: item.question,
          yesVotes: parseInt(item.yes_votes || 0),
          noVotes: parseInt(item.no_votes || 0),
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          image: item.image,
          description: item.description,
          contractAddress: item.contract_address
        }));
      }
    } catch (err) { 
      console.error("Supabase Connection Error:", err); 
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const createMarket = async (market: Omit<PredictionMerket, 'id' | 'yesVotes' | 'noVotes' | 'createdAt'>): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
        try {
          const payload = {
            question: market.question,
            description: market.description || FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)],
            image: market.image || BRAND_LOGO,
            yes_votes: 0,
            no_votes: 0,
            contract_address: market.contractAddress
          };
          
          const { error, data } = await supabase.from('markets').insert([payload]).select();
          
          if (!error) {
            console.log("SUCCESS: Market created in Supabase.", data);
            return;
          }
          
          console.error("SUPABASE ERROR (Insert):", error.message, "Details:", error.details);
          alert(`Supabase Error: ${error.message}. Fallback to local storage.`);
        } catch (err) {
          console.error("CRITICAL SUPABASE ERROR:", err);
        }
    } else {
      console.warn("Supabase not configured. Saving to local storage.");
    }

    // Local Fallback
    const newMarket: PredictionMerket = {
        ...market,
        id: `local-${crypto.randomUUID()}`,
        yesVotes: 0,
        noVotes: 0,
        createdAt: Date.now(),
        image: market.image || BRAND_LOGO
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const currentMarkets: PredictionMerket[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newMarket, ...currentMarkets]));
};

export const voteMerket = async (id: string, option: 'YES' | 'NO'): Promise<void> => {
  const previousVote = getUserVote(id);
  if (previousVote === option) return;

  if (isSupabaseConfigured() && supabase && !id.startsWith('local-')) {
    try {
      const { error } = await supabase.rpc('increment_vote', { 
          market_id: parseInt(id), 
          vote_type: option,
          previous_vote: previousVote 
      });
      
      if (!error) {
        saveUserVote(id, option);
        return;
      }
      console.error("SUPABASE ERROR (Vote RPC):", error.message);
    } catch (err) {
      console.error("RPC Catch:", err);
    }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  const merkets: PredictionMerket[] = stored ? JSON.parse(stored) : [];
  const updated = merkets.map((m: PredictionMerket) => {
    if (m.id !== id) return m;
    let newYes = m.yesVotes;
    let newNo = m.noVotes;
    if (previousVote === 'YES') newYes = Math.max(0, newYes - 1);
    if (previousVote === 'NO') newNo = Math.max(0, newNo - 1);
    if (option === 'YES') newYes += 1;
    if (option === 'NO') newNo += 1;
    return { ...m, yesVotes: newYes, noVotes: newNo };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  saveUserVote(id, option);
};

export const getComments = async (marketId: string): Promise<MerketComment[]> => {
  if (isSupabaseConfigured() && supabase && !marketId.startsWith('local-')) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('market_id', parseInt(marketId))
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (err) {}
  }
  const stored = localStorage.getItem(COMMENTS_KEY);
  const allComments: MerketComment[] = stored ? JSON.parse(stored) : [];
  return allComments.filter(c => c.market_id === marketId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const postComment = async (marketId: string, username: string, content: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase && !marketId.startsWith('local-')) {
    try {
      const { error } = await supabase.from('comments').insert([{ 
        market_id: parseInt(marketId), 
        username, 
        content 
      }]);
      if (!error) return;
    } catch (err) {}
  }
  const stored = localStorage.getItem(COMMENTS_KEY);
  const allComments = stored ? JSON.parse(stored) : [];
  const newComment = { id: crypto.randomUUID(), market_id: marketId, username, content, created_at: new Date().toISOString() };
  localStorage.setItem(COMMENTS_KEY, JSON.stringify([newComment, ...allComments]));
};
