
export type MarketType = 'STANDARD' | 'MCAP_TARGET';
export type MarketStatus = 'OPEN' | 'RESOLVED_YES' | 'EXPIRED'; // RESOLVED_NO is effectively EXPIRED

export interface PredictionMerket {
  id: string;
  user_id?: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  createdAt: number;
  image?: string;
  description?: string;
  contractAddress?: string;
  optionA?: string;
  optionB?: string;
  
  // New fields for MCAP Target markets
  marketType: MarketType;
  targetMarketCap?: number; // e.g., 15000000 for 15M
  expiresAt?: number; // timestamp
  status: MarketStatus;
}

export interface MerketComment {
  id: string;
  market_id: string;
  user_id?: string;
  username: string;
  content: string;
  created_at: string;
}

export type VoteOption = 'YES' | 'NO';
