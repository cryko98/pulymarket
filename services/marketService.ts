
import { PredictionMerket, MerketComment } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const COMMENTS_KEY = 'poly_market_comments_v1';
const USER_VOTES_KEY = 'poly_user_votes_v4'; 
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
    console.error("Dexscreener fetch error:", err);
    return null;
  }
};

// Tracks which option the specific user chose (browser-based identity)
export const getUserVote = (merketId: string): 'YES' | 'NO' | null => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : {};
    return votes[merketId] || null;
  } catch (e) {
    return null;
  }
};

export const hasUserVoted = (merketId: string): boolean => {
  return getUserVote(merketId) !== null;
};

// We only save the FACT that the user voted locally. 
// The actual COUNTS are strictly in Supabase.
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
  // STRICT SUPABASE ONLY - No Local Storage Fallback for Markets
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('id, question, yes_votes, no_votes, created_at, image, description, contract_address, option_a, option_b')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id.toString(),
          question: item.question,
          yesVotes: parseInt(item.yes_votes || 0),
          noVotes: parseInt(item.no_votes || 0),
          createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
          image: item.image,
          description: item.description || FUNNY_INSIGHTS[Math.floor(Math.random() * FUNNY_INSIGHTS.length)],
          contractAddress: item.contract_address,
          optionA: item.option_a || 'YES',
          optionB: item.option_b || 'NO'
        }));
      }
    } catch (err) { 
        console.error("Supabase fetch error:", err); 
    }
  }
  return [];
};

export const createMarket = async (market: Omit<PredictionMerket, 'id' | 'yesVotes' | 'noVotes' | 'createdAt'>): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('markets').insert([{
            question: market.question,
            description: market.description,
            image: market.image || BRAND_LOGO,
            yes_votes: 0,
            no_votes: 0,
            contract_address: market.contractAddress,
            option_a: market.optionA || 'YES',
            option_b: market.optionB || 'NO'
        }]);
    } else {
        console.error("Supabase not configured. Cannot create market.");
        alert("Database connection missing. Cannot deploy market.");
    }
};

// IMPROVED VOTING LOGIC: Uses RPC for atomic updates
export const voteMerket = async (id: string, option: 'YES' | 'NO'): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) {
      console.error("No Supabase connection");
      return;
  }

  const previousVote = getUserVote(id);
  if (previousVote === option) return; // No change needed

  try {
    // Call the SQL function (RPC) to handle atomic increment/decrement
    // This prevents race conditions and "jumping" votes
    const { error } = await supabase.rpc('vote_market', {
        p_market_id: parseInt(id),
        p_vote_type: option,
        p_previous_vote: previousVote || null
    });

    if (error) {
        console.error("RPC Error:", error);
        // Fallback: If RPC fails (e.g. function not created), try direct update
        // Note: This is less safe but provides a fallback
        await manualVoteFallback(id, option, previousVote);
    } else {
        // Only update local state if server confirmed success
        saveUserVote(id, option);
    }

  } catch (err) {
      console.error("Vote transaction failed:", err);
      throw err;
  }
};

const manualVoteFallback = async (id: string, option: 'YES' | 'NO', previousVote: 'YES' | 'NO' | null) => {
    if (!supabase) return;
    
    const { data } = await supabase.from('markets').select('yes_votes, no_votes').eq('id', id).single();
    if (!data) return;

    let { yes_votes, no_votes } = data;

    if (previousVote === 'YES') yes_votes--;
    if (previousVote === 'NO') no_votes--;
    
    if (option === 'YES') yes_votes++;
    if (option === 'NO') no_votes++;

    await supabase.from('markets').update({ yes_votes, no_votes }).eq('id', id);
    saveUserVote(id, option);
};

export const getComments = async (marketId: string): Promise<MerketComment[]> => {
  if (isSupabaseConfigured() && supabase) {
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
  if (isSupabaseConfigured() && supabase) {
    await supabase.from('comments').insert([{ market_id: marketId, username, content }]);
  } else {
      const stored = localStorage.getItem(COMMENTS_KEY);
      const allComments = stored ? JSON.parse(stored) : [];
      const newComment = { id: crypto.randomUUID(), market_id: marketId, username, content, created_at: new Date().toISOString() };
      localStorage.setItem(COMMENTS_KEY, JSON.stringify([newComment, ...allComments]));
  }
};
