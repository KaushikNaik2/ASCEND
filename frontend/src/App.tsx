import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'
import KnowledgeConstellation from './components/canvas/KnowledgeConstellation'
import CustomCursor from './components/ui/CustomCursor'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import SignUpPage from './pages/SignUpPage'
import ModeSelectionPage from './pages/ModeSelectionPage'
import HomePage from './pages/HomePage'
import UploadCurriculumPage from './pages/UploadCurriculumPage'
import QuizPage from './pages/QuizPage'
import RoadmapPage from './pages/RoadmapPage'
import DashboardPage from './pages/DashboardPage'

import { useStore } from './store/useStore'

function App() {
  const location = useLocation()
  const { sceneState } = useStore()

  const currentSceneState =
    location.pathname === '/'
      ? 'upload'
      : sceneState ?? 'dashboard'

  return (
    <div className="relative w-screen min-h-screen bg-slate-950 text-slate-50 font-sans overflow-x-hidden">
      <CustomCursor />

      {/* 3D Background Layer */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
          <color attach="background" args={['#0f172a']} />
          <KnowledgeConstellation appState={currentSceneState as any} />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
          />
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col pointer-events-none">
        <main className="flex-1 w-full pointer-events-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage type="login" />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Mode Selection (post-auth) */}
              <Route path="/mode-selection" element={<ModeSelectionPage />} />

              {/* Post-auth app pages */}
              <Route path="/home" element={<HomePage />} />
              <Route path="/upload-curriculum" element={<UploadCurriculumPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default App
