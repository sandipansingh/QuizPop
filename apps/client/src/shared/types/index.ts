// Auth

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
  level?: number;
  rating_points?: number;
}

export interface AuthPayload {
  user: User;
  access_token: string;
}

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  difficulty?: string;
}

export interface QuizAnswer {
  question_id: string;
  selected_answer: string;
  time_taken: number;
}

export interface QuizSubmitResult {
  score: number;
  correct_answers: number;
  total_questions: number;
  average_response: number;
}

// Room

export interface RoomPlayer {
  user_id: string;
  username: string;
  score: number;
  avatar_url: string | null;
  user?: { username?: string; avatar_url?: string | null };
}

export interface Room {
  id: string;
  host_id: string;
  status: 'waiting' | 'active' | 'ended';
  players?: RoomPlayer[];
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  score: number;
  rank: number;
}

// Leaderboard

export interface LeaderboardRow {
  user_id: string;
  username: string;
  total_score: number;
  accuracy_percentage: number;
  total_quizzes_played: number;
  rank: string;
  global_rank: number;
}

// User

export interface UserStats {
  overview?: {
    total_quizzes_played?: number;
    total_score?: number;
    accuracy_percentage?: number;
    current_streak?: number;
    longest_streak?: number;
    rank?: string;
  };
}

export interface PublicProfilePayload {
  profile: User | null;
  overview?: {
    total_quizzes_played?: number;
    total_score?: number;
    accuracy_percentage?: number;
    current_streak?: number;
    longest_streak?: number;
    rank?: string;
  };
  achievements?: Array<{
    code: string;
    title: string;
    xp_reward: number;
    unlocked_at: string;
  }>;
}
