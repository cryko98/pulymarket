
import { PredictionMerket, MerketComment, MarketStatus, MarketType, MarketOption } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const USER_VOTES_KEY = 'poly_user_votes_v5'; // Incremented version to avoid conflicts
const BRAND_LOGO = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

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

export const getUserVote = (merketId: string): string | null => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : {};
    return votes[merketId] || null; // Returns option ID
  } catch (e) {
    return null;
  }
};

const saveUserVote = (merketId: string, optionId: string) => {
  try {
    const stored = localStorage.getItem(USER_VOTES_KEY);
    const votes = stored ? JSON.parse(stored) : {};
    votes[merketId] = optionId;
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
        .select('*, market_options(*)')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase getMerkets error:", error);
        throw error;
      }

      if (data) {
        return data.map((item: any) => ({
          id: item.id.toString(),
          question: item.question,
          createdAt: new Date(item.created_at).getTime(),
          image: item.image,
          description: item.description,
          contractAddress: item.contract_address,
          marketType: item.market_type || 'STANDARD',
          targetMarketCap: item.target_market_cap ? Number(item.target_market_cap) : undefined,
          expiresAt: item.expires_at ? new Date(item.expires_at).getTime() : undefined,
          status: item.status || 'OPEN',
          options: (item.market_options || []).map((opt: any) => ({
            id: opt.id.toString(),
            market_id: opt.market_id.toString(),
            option_text: opt.option_text,
            votes: opt.votes
          })),
        }));
      }
    } catch (err) { 
        console.error("Supabase fetch exception:", err);
    }
  }
  return [];
};

export const createMarket = async (
    marketData: Omit<PredictionMerket, 'id' | 'createdAt' | 'status' | 'options'> & { options: string[] }
): Promise<void> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.error("Supabase not configured. Cannot create market.");
        alert("Database connection missing. Cannot deploy market.");
        return;
    }
    
    const { marketType, question, description, image, contractAddress, targetMarketCap, expiresAt, options } = marketData;

    const marketToInsert = {
        question,
        description,
        image: image || BRAND_LOGO,
        contract_address: contractAddress,
        market_type: marketType,
        target_market_cap: targetMarketCap,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: 'OPEN',
    };

    const { data: newMarket, error: marketError } = await supabase.from('markets').insert(marketToInsert).select().single();

    if (marketError) {
        console.error("Error creating market:", marketError);
        alert(`Failed to create market: ${marketError.message}`);
        throw marketError;
    }

    const optionsToInsert = options.map(opt => ({
        market_id: newMarket.id,
        option_text: opt,
        votes: 0
    }));

    const { error: optionsError } = await supabase.from('market_options').insert(optionsToInsert);

    if (optionsError) {
        console.error("Market created, but failed to add options:", optionsError);
        // Ideally, we'd delete the market here, but for simplicity we'll alert the user.
        alert(`Market was created, but failed to add options: ${optionsError.message}`);
        throw optionsError;
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

export const voteOnOption = async (newOptionId: string, oldOptionId: string | null, status: MarketStatus): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase || status !== 'OPEN') {
      console.error("Cannot vote on this market.");
      return;
  }
  
  if (newOptionId === oldOptionId) return;

  try {
    const { error } = await supabase.rpc('vote_on_market_option', {
        p_new_option_id: parseInt(newOptionId, 10),
        p_old_option_id: oldOptionId ? parseInt(oldOptionId, 10) : null
    });

    if (error) {
        console.error("RPC Error:", error);
        throw error;
    } else {
        saveUserVote(newOptionId.toString(), newOptionId);
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
