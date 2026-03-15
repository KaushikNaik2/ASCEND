import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UploadZone from '../components/ui/UploadZone'
import ProcessingView from '../components/ui/ProcessingView'
import ResultsView from '../components/ui/ResultsView'
import { mockSyllabus } from '../lib/mockData'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import type { AppState } from '../types'

export default function GeneratePage() {
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const { isAuthenticated, setCurrentSyllabus, setSceneState } = useStore()
  const navigate = useNavigate()

  const handleFileSelect = (selectedFile: File) => {
    if (!isAuthenticated) {
      navigate('/signup')
      return
    }
    setFile(selectedFile)
    setStep('processing')
    setSceneState('processing') // Speed up background particles
  }

  const handleConfirmSyllabus = () => {
    setCurrentSyllabus(mockSyllabus)
    setSceneState('dashboard')
    navigate('/roadmap/1') // Redirect to the newly generated roadmap
  }

  // Redirect directly to dashboard
  const handleRedirectDashboard = () => {
    setCurrentSyllabus(mockSyllabus)
    setSceneState('dashboard')
    navigate('/dashboard')
  }

  return (
    <div className="w-full h-full min-h-[70vh] flex flex-col items-center justify-center p-6 relative z-10">
      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl"
          >
            <div className="text-center mb-8">
               <h1 className="text-4xl font-bold mb-4">Generate Your Roadmap</h1>
               <p className="text-slate-400">Upload your syllabus to instantly build a structured learning path.</p>
            </div>
            <UploadZone onFileSelect={handleFileSelect} />
          </motion.div>
        )}

        {step === 'processing' && (
          <ProcessingView 
            key="processing-view"
            setAppState={(state: AppState) => {
              if (state === 'results') setStep('results')
              else if (state === 'dashboard') handleRedirectDashboard()
              else if (state === 'error') navigate('/error')
            }} 
            fileName={file?.name || "syllabus.pdf"} 
          />
        )}

        {step === 'results' && (
          <ResultsView 
            key="results-view"
            data={mockSyllabus} 
            setAppState={(state: AppState) => {
              if (state === 'dashboard') handleConfirmSyllabus()
              else if (state === 'upload') setStep('upload')
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

