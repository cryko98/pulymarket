
export interface PredictionMerket {
  id: string;
  question: string;
  yesVotes: number;
  noVotes: number;
  createdAt: number;
  image?: string;
  description?: string; // For funny mock text
}

export type VoteOption = 'YES' | 'NO';
