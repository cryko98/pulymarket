
import { PredictionMerket, MerketComment, MarketStatus, MarketType } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const USER_VOTES_KEY = 'poly_user_votes_v4'; 
const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

// Helper to parse MCAP string like "15.2M" or "250.5K" into a number
const parseMcapToNumber = (mcap: string): number => {
    const value = parseFloat(mcap);
    if (mcap.toUpperCase().includes('M')) return value * 1_000_000;
    if (mcap.toUpperCase().includes('K')) return value * 1_000;
    return value;
};

export const fetchMarketCap = async (ca: string): Promise<{ formatted: string; raw: number } | null> => {
  if (!ca || ca.length < 32) return null;
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const mcap = data.pairs[0].fdv;
      if (mcap == null) return { formatted: "N/A", raw: 0 };

      let formattedMcap: string;
      if (mcap >= 1000000) formattedMcap = `${(mcap / 1000000).toFixed(2)}M`;
      else if (mcap >= 1000) formattedMcap = `${(mcap / 1000).toFixed(1)}K`;
      else formattedMcap = `${mcap.toFixed(0)}`;
      
      return { formatted: formattedMcap, raw: mcap };
    }
    return { formatted: "N/A", raw: 0 };
  } catch (err) {
    console.error("Dexscreener fetch error:", err);
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
        .select('id, question, yes_votes, no_votes, created_at, image, description, contract_address, option_a, option_b, market_type, target_market_cap, expires_at, status')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase getMerkets error:", error);
        throw error;
      }

      if (data) {
        return data.map((item: any) => ({
          id: item.id.toString(),
          question: item.question,
          yesVotes: parseInt(item.yes_votes || 0),
          noVotes: parseInt(item.no_votes || 0),
          createdAt: new Date(item.created_at).getTime(),
          image: item.image,
          description: item.description,
          contractAddress: item.contract_address,
          optionA: item.option_a || 'YES',
          optionB: item.option_b || 'NO',
          marketType: item.market_type || 'STANDARD',
          targetMarketCap: item.target_market_cap ? Number(item.target_market_cap) : undefined,
          expiresAt: item.expires_at ? new Date(item.expires_at).getTime() : undefined,
          status: item.status || 'OPEN',
        }));
      }
    } catch (err) { 
        console.error("Supabase fetch exception:", err);
    }
  }
  return [];
};

export const createMarket = async (marketData: Omit<PredictionMerket, 'id' | 'yesVotes' | 'noVotes' | 'createdAt' | 'status'> & { status?: MarketStatus }): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
        const { marketType, question, description, image, contractAddress, optionA, optionB, targetMarketCap, expiresAt } = marketData;
        
        const { error } = await supabase.from('markets').insert([{
            question,
            description,
            image: image || BRAND_LOGO,
            yes_votes: 0,
            no_votes: 0,
            contract_address: contractAddress,
            option_a: optionA || 'YES',
            option_b: optionB || 'NO',
            market_type: marketType,
            target_market_cap: targetMarketCap,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            status: 'OPEN',
        }]);

        if (error) {
            console.error("Error creating market:", error);
            alert(`Failed to create market: ${error.message}`);
        }

    } else {
        console.error("Supabase not configured. Cannot create market.");
        alert("Database connection missing. Cannot deploy market.");
    }
};

export const checkAndResolveMarket = async (market: PredictionMerket): Promise<PredictionMerket | null> => {
    if (!supabase || market.status !== 'OPEN' || market.marketType !== 'MCAP_TARGET' || !market.contractAddress || !market.targetMarketCap || !market.expiresAt) {
        return null;
    }

    const now = Date.now();
    let newStatus: MarketStatus | null = null;

    if (now > market.expiresAt) {
        newStatus = 'EXPIRED';
    } else {
        const mcapData = await fetchMarketCap(market.contractAddress);
        if (mcapData && mcapData.raw >= market.targetMarketCap) {
            newStatus = 'RESOLVED_YES';
        }
    }

    if (newStatus) {
        const { error } = await supabase
            .from('markets')
            .update({ status: newStatus })
            .eq('id', market.id);
        
        if (!error) {
            return { ...market, status: newStatus };
        }
    }
    
    return null; // No change
};

export const voteMerket = async (id: string, option: 'YES' | 'NO', status: MarketStatus): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase || status !== 'OPEN') {
      console.error("Cannot vote on this market.");
      return;
  }
  
  const previousVote = getUserVote(id);
  if (previousVote === option) return;

  try {
    const { error } = await supabase.rpc('vote_market', {
        p_market_id: parseInt(id, 10),
        p_vote_type: option,
        p_previous_vote: previousVote || null
    });

    if (error) {
        console.error("RPC Error:", error);
        throw error;
    } else {
        saveUserVote(id, option);
    }

  } catch (err) {
      console.error("Vote transaction failed:", err);
      throw err;
  }
};

export const getComments = async (marketId: string): Promise<MerketComment[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true });
    if (!error && data) return data as MerketComment[];
  }
  return [];
};

export const postComment = async (marketId: string, content: string, username: string): Promise<void> => {
  if (!content.trim()) return;

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('comments').insert([
        { 
            market_id: marketId, 
            content,
            username: username.trim() || 'anon'
        }
    ]);
    if (error) throw error;
  }
};