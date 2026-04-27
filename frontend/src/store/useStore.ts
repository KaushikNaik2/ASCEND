import { create } from 'zustand';
import type { SyllabusResponse } from '../types';

interface AppState {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  currentSyllabus: SyllabusResponse | null;
  goldenSyllabusId: string | null;
  setAuthenticated: (status: boolean) => void;
  setUser: (user: { id: string; email: string } | null) => void;
  setCurrentSyllabus: (syllabus: SyllabusResponse | null) => void;
  setGoldenSyllabusId: (id: string | null) => void;
  sceneState?: 'upload' | 'processing' | 'results' | 'dashboard';
  setSceneState: (state: 'upload' | 'processing' | 'results' | 'dashboard') => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  currentSyllabus: null,
  goldenSyllabusId: null,
  sceneState: 'dashboard',
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  setUser: (user) => set({ user }),
  setCurrentSyllabus: (syllabus) => set({ currentSyllabus: syllabus }),
  setGoldenSyllabusId: (id) => set({ goldenSyllabusId: id }),
  setSceneState: (state) => set({ sceneState: state }),
  logout: () => set({ isAuthenticated: false, user: null, currentSyllabus: null, goldenSyllabusId: null, sceneState: 'dashboard' }),
}));
