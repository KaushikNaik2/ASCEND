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
