import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UploadZone from '../components/ui/UploadZone'
import ProcessingView from '../components/ui/ProcessingView'
import ResultsView from '../components/ui/ResultsView'
import { uploadSyllabus, confirmSyllabus } from '../lib/api'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import type { AppState, SyllabusResponse } from '../types'

export default function GeneratePage() {
  const [step, setStep] = useState<'upload' | 'processing' | 'results' | 'error'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [progressData, setProgressData] = useState<{ progress: number; step: number; message: string } | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const { isAuthenticated, currentSyllabus, setCurrentSyllabus, setGoldenSyllabusId, setSceneState } = useStore()
  const navigate = useNavigate()

  // Ref to track whether the API has resolved (for race-condition with ProcessingView timer)
  const apiResult = useRef<{ data: SyllabusResponse[]; goldenId: string | null } | null>(null)
  const apiDone = useRef(false)

  const handleFileSelect = async (selectedFile: File) => {
    if (!isAuthenticated) {
      navigate('/signup')
      return
    }

    setFile(selectedFile)
    setStep('processing')
    setSceneState('processing')
    setErrorMsg('')
    setProgressData(null)

    try {
      const response = await uploadSyllabus(selectedFile, 'Unknown', (data) => {
        setProgressData(data)
      })

      // Store the first subject as the current syllabus
      const firstSubject = response.data?.[0] ?? null
      apiResult.current = { data: response.data, goldenId: response.golden_syllabus_id }
      apiDone.current = true

      if (firstSubject) {
        setCurrentSyllabus(firstSubject)
        setGoldenSyllabusId(response.golden_syllabus_id)
      }

      // Transition to results (the ProcessingView may still be animating — 
      // this will override it as soon as the API resolves)
      setStep('results')
      setSceneState('results')
    } catch (err: any) {
      console.error('Upload failed:', err)
      apiDone.current = true
      setErrorMsg(err.message || 'Upload failed. Please try again.')
      setStep('error')
      setSceneState('upload')
    }
  }

  const handleConfirmSyllabus = async () => {
    setIsApproving(true)
    const goldenId = useStore.getState().goldenSyllabusId
    const syllabusData = useStore.getState().currentSyllabus
    const userId = useStore.getState().user?.id ?? 'anonymous'

    if (goldenId && syllabusData) {
      try {
        // Send the ENTIRE array of parsed subjects to the backend to generate all roadmaps
        const customizedData = apiResult.current?.data || [syllabusData]

        await confirmSyllabus({
          user_id: userId,
          golden_syllabus_id: goldenId,
          customized_data: customizedData,
          is_edited: false,
        })
      } catch (err) {
        console.error('Confirm failed (non-blocking):', err)
        // Non-blocking — still navigate to roadmap
      }
    }

    setIsApproving(false)
    setSceneState('dashboard')
    navigate('/roadmap/1')
  }

  // Called when ProcessingView timer finishes (cosmetic timer is done)
  const handleProcessingDone = (state: AppState) => {
    if (state === 'dashboard' || state === 'results') {
      // If API has resolved, go to results; otherwise wait for it
      if (apiDone.current && apiResult.current) {
        setStep('results')
        setSceneState('results')
      }
      // If API hasn't resolved yet, stay on processing — handleFileSelect will advance us
    } else if (state === 'error') {
      navigate('/error')
    }
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
            setAppState={handleProcessingDone}
            fileName={file?.name || "syllabus.pdf"}
            progressData={progressData}
          />
        )}

        {step === 'results' && currentSyllabus && (
          <ResultsView
            key="results-view"
            data={currentSyllabus}
            onApprove={handleConfirmSyllabus}
            isApproving={isApproving}
            setAppState={(state: AppState) => {
              if (state === 'dashboard') handleConfirmSyllabus()
              else if (state === 'upload') {
                setStep('upload')
                apiResult.current = null
                apiDone.current = false
              }
            }}
          />
        )}

        {step === 'error' && (
          <motion.div
            key="error-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg text-center"
          >
            <div className="glass-panel p-10 rounded-3xl border border-red-500/20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Upload Failed</h2>
              <p className="text-slate-400 mb-6 text-sm">{errorMsg}</p>
              <button
                onClick={() => { setStep('upload'); setErrorMsg('') }}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
