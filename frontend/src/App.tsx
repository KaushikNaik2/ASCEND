import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import CanvasErrorBoundary from './components/canvas/CanvasErrorBoundary'
import CustomCursor from './components/ui/CustomCursor'
import Header from './components/layout/Header'
import './App.css'

// Lazy-load the heavy 3D background so it doesn't block initial render
const ThreeBackground = lazy(() => import('./components/canvas/ThreeBackground'))

// Pages
import LandingPage from './pages/LandingPage'
import GeneratePage from './pages/GeneratePage'
import AuthPage from './pages/AuthPage'
import BrowseRoadmaps from './pages/BrowseRoadmaps'
import RoadmapViewer from './pages/RoadmapViewer'
import DashboardPage from './pages/DashboardPage'
import StudyPlanPage from './pages/StudyPlanPage'
import GuidesPage from './pages/GuidesPage'
import OnboardingPage from './pages/OnboardingPage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import QuizSessionPage from './pages/QuizSessionPage'
import QuizResultsPage from './pages/QuizResultsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import { useStore } from './store/useStore'

/** Static gradient fallback when 3D Canvas is loading or unavailable */
function BackgroundFallback() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #1e293b 0%, #0f172a 70%)',
      }}
    />
  )
}

function App() {
  const location = useLocation()
  const { sceneState } = useStore()

  // Use the global scene state if we're on the generate page so it can override the default
  // otherwise fallback to path-based logic
  const currentSceneState = location.pathname === '/generate' && sceneState
    ? sceneState
    : location.pathname === '/'
      ? 'upload'
      : 'dashboard'

  return (
    <div className="relative w-screen min-h-screen bg-slate-950 text-slate-50 font-sans overflow-x-hidden">
      <CustomCursor />
      {/* 3D Background Layer — hidden on /roadmap/* and /graph to prevent WebGL conflicts with React Flow */}
      {!location.pathname.startsWith('/roadmap/') && location.pathname !== '/graph' && (
        <CanvasErrorBoundary fallback={<BackgroundFallback />}>
          <Suspense fallback={<BackgroundFallback />}>
            <ThreeBackground appState={currentSceneState as any} />
          </Suspense>
        </CanvasErrorBoundary>
      )}
      {(location.pathname.startsWith('/roadmap/') || location.pathname === '/graph') && <BackgroundFallback />}

      {/* UI Overlay Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col pointer-events-none">
        <Header />
        {/* Main Content Area */}
        <main className="flex-1 w-full pointer-events-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/roadmaps" element={<BrowseRoadmaps />} />
              <Route path="/roadmap/:id" element={<RoadmapViewer />} />
              <Route path="/roadmap/:id/plan" element={<StudyPlanPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/welcome" element={<OnboardingPage />} />
              <Route path="/pathfinder" element={<div className="min-h-screen flex items-center justify-center text-white text-2xl font-bold relative z-10">Pathfinder — Coming in Phase 2</div>} />
              <Route path="/tracks" element={<div className="min-h-screen flex items-center justify-center text-white text-2xl font-bold relative z-10">Curated Tracks — Coming in Phase 2</div>} />
              <Route path="/graph" element={<KnowledgeGraphPage />} />
              <Route path="/quiz/session" element={<QuizSessionPage />} />
              <Route path="/quiz/:clusterId" element={<QuizSessionPage />} />
              <Route path="/quiz/:sessionId/results" element={<QuizResultsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<AuthPage type="login" />} />
              <Route path="/signup" element={<AuthPage type="signup" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default App
