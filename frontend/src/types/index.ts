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

// --- New types per PRD ---

export type Mode = 'academics' | 'skills';

export interface QuizQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
}

export interface SubjectChip {
  name: string;
  status: 'verified' | 'rejected' | 'pending';
}

export interface SignupData {
  name: string;
  dob: string;
  phone: string;
  profession: 'student' | 'working_professional' | '';
  workplace: string;
  qualification: string;
  hasCurrentCourse: boolean | null;
  courseName: string;
  university: string;
  city: string;
}
