
export interface PredictionMerket {
  id: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  createdAt: number;
  image?: string;
  description?: string;
  contractAddress?: string; // Optional Solana CA
}

export interface MerketComment {
  id: string;
  market_id: string;
  username: string;
  content: string;
  created_at: string;
}

export type VoteOption = 'YES' | 'NO';
