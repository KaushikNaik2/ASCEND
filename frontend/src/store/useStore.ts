import { create } from 'zustand';
import type { SyllabusResponse } from '../types';

interface AppState {
  isAuthenticated: boolean;
  user: any | null;
  currentSyllabus: SyllabusResponse | null;
  setAuthenticated: (status: boolean) => void;
  setUser: (user: any) => void;
  setCurrentSyllabus: (syllabus: SyllabusResponse | null) => void;
  sceneState?: 'upload' | 'processing' | 'results' | 'dashboard';
  setSceneState: (state: 'upload' | 'processing' | 'results' | 'dashboard') => void;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  currentSyllabus: null,
  sceneState: 'dashboard',
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setUser: (user) => set({ user }),
  setCurrentSyllabus: (syllabus) => set({ currentSyllabus: syllabus }),
  setSceneState: (state) => set({ sceneState: state }),
}));
