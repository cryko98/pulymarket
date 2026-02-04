
export type MarketType = 'STANDARD' | 'MCAP_TARGET';
export type MarketStatus = 'OPEN' | 'RESOLVED_YES' | 'EXPIRED'; // RESOLVED_NO is effectively EXPIRED

export interface MarketOption {
  id: string;
  market_id: string;
  option_text: string;
  votes: number;
}

export interface PredictionMerket {
  id: string;
  question: string;
  createdAt: number;
  image?: string;
  description?: string;
  contractAddress?: string;
  
  options: MarketOption[];

  // New fields for MCAP Target markets
  marketType: MarketType;
  targetMarketCap?: number; // e.g., 15000000 for 15M
  expiresAt?: number; // timestamp
  status: MarketStatus;
}

export interface MerketComment {
  id: string;
  market_id: string;
  username: string;
  content: string;
  created_at: string;
}

export type VoteOption = 'YES' | 'NO'; // This is now legacy, but might be kept for type safety in old components if needed.
