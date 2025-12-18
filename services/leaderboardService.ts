import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface LeaderboardEntry {
  username: string;
  score: number;
  created_at?: string;
}

const TABLE_NAME = 'predictoors';
const LOCAL_STORAGE_KEY = 'predictoors_local_scores';

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  // TOP 5 LIMIT
  const LIMIT = 5;

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('username, score')
      .order('score', { ascending: false })
      .limit(LIMIT);
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    return data || [];
  }

  // Fallback to local storage for demo
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored).slice(0, LIMIT) : [
    { username: 'SBF', score: 2500 },
    { username: 'CZ', score: 1800 },
    { username: 'ELN', score: 1200 },
    { username: 'VIT', score: 800 },
    { username: 'SAT', score: 500 },
  ];
};

export const submitScore = async (username: string, score: number): Promise<void> => {
  // 0 pontot nem mentünk el
  if (score <= 0) return;

  if (isSupabaseConfigured() && supabase) {
    try {
      // 1. Check existing user
      const { data: existingUser } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('username', username)
        .single();

      if (existingUser) {
        // 2. Update ONLY if new score is higher
        if (score > existingUser.score) {
          await supabase
            .from(TABLE_NAME)
            .update({ score: score, created_at: new Date() })
            .eq('id', existingUser.id);
        }
      } else {
        // 3. Insert new user
        await supabase
          .from(TABLE_NAME)
          .insert([{ username, score }]);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
    return;
  }

  // Fallback local storage logic
  const current = await getLeaderboard(); // This gets top 5, but for storage we need full list theoretically, but simplified here
  
  // Re-read full storage to handle updates correctly in local demo
  const rawStored = localStorage.getItem(LOCAL_STORAGE_KEY);
  let allScores: LeaderboardEntry[] = rawStored ? JSON.parse(rawStored) : [];
  
  const existingIndex = allScores.findIndex(s => s.username === username);
  
  if (existingIndex >= 0) {
    // Update if higher
    if (score > allScores[existingIndex].score) {
      allScores[existingIndex].score = score;
    }
  } else {
    // Add new
    allScores.push({ username, score });
  }

  // Sort and Save
  allScores.sort((a, b) => b.score - a.score);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allScores));
};