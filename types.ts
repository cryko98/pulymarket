export interface PredictionMarket {
  id: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  totalVolume: number; // Simulated volume
  createdAt: number;
  image?: string;
}

export type VoteOption = 'YES' | 'NO';