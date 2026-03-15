import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'
import KnowledgeConstellation from './components/canvas/KnowledgeConstellation'
import CustomCursor from './components/ui/CustomCursor'
import Header from './components/layout/Header'

// Pages
import LandingPage from './pages/LandingPage'
import GeneratePage from './pages/GeneratePage'
import AuthPage from './pages/AuthPage'
import BrowseRoadmaps from './pages/BrowseRoadmaps'
import RoadmapViewer from './pages/RoadmapViewer'
import DashboardPage from './pages/DashboardPage'
import StudyPlanPage from './pages/StudyPlanPage'
import GuidesPage from './pages/GuidesPage'
import { useStore } from './store/useStore'

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
