
export interface PredictionMerket {
  id: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  createdAt: number;
  image?: string;
  description?: string;
  contractAddress?: string; // Optional Solana CA
  optionA?: string; // Custom label for "YES" (Green)
  optionB?: string; // Custom label for "NO" (Red)
}

export interface MerketComment {
  id: string;
  market_id: string;
  username: string;
  content: string;
  created_at: string;
}

export type VoteOption = 'YES' | 'NO';
