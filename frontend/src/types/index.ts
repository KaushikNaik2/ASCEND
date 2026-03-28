export interface SubTopic {
  title: string;
  estimated_hours?: string;
}

export interface Module {
  module_number: string;
  title: string;
  topics: SubTopic[];
}

export interface SyllabusResponse {
  subject_name: string;
  semester?: string;
  modules: Module[];
}

export type AppState = 'upload' | 'processing' | 'results' | 'error' | 'login' | 'signup' | 'dashboard' | 'studyplan';

// ─── ASCEND Core Types ───────────────────────────────────────────────────────

export type Track = 'academic' | 'forge';
export type MasteryState = 'locked' | 'available' | 'in_progress' | 'mastered';
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ConceptCluster {
  id: string;
  label: string;
  module_ref: string;
  bloom_depth: BloomLevel;
  difficulty_avg: number;
  mastery_score: number; // 0.0 – 1.0
  mastery_state: MasteryState;
  weakness_tags?: string[];
  order_index: number;
  prerequisites?: string[]; // cluster IDs
}

export interface KnowledgeGraph {
  graph_id: string;
  subject_name: string;
  track: Track;
  clusters: ConceptCluster[];
}

export interface QuizQuestion {
  id: string;
  cluster_id: string;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: number;
  bloom_level: BloomLevel;
}

export interface QuizSession {
  session_id: string;
  cluster_id: string;
  track: Track;
  questions: QuizQuestion[];
  current_index: number;
  answers: (number | null)[];
  score?: number;
  vector_delta?: Record<string, number>;
}

export interface UserStats {
  xp: number;
  level: number;
  level_label: 'Novice' | 'Learner' | 'Practitioner' | 'Expert';
  streak_days: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  institution: string;
  xp: number;
  streak_days: number;
  is_current_user?: boolean;
}

export type ForgeDomaain =
  | 'DSA'
  | 'Web Dev'
  | 'AI/ML'
  | 'System Design'
  | 'DevOps'
  | 'Database Engineering';
