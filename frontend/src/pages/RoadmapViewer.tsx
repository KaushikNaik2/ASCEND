import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Bot, PlayCircle, FileText, ChevronRight, X, Loader2, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getUserRoadmaps, updateTopicProgress } from '../lib/api'
import type { UserRoadmap } from '../lib/api'

export default function RoadmapViewer() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const subjectIndex = parseInt(searchParams.get('subjectIndex') || '0', 10)

  const { user } = useStore()
  const navigate = useNavigate()

  const [roadmapData, setRoadmapData] = useState<UserRoadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [progressState, setProgressState] = useState<Record<string, string>>({})
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      if (!user?.id || !id) {
        setIsLoading(false)
        return
      }
      try {
        const res = await getUserRoadmaps(user.id)
        const found = res.data.find((r) => r.id === id)
        if (found) {
          setRoadmapData(found)
          setProgressState(found.progress_state || {})
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [user?.id, id])

  if (isLoading) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center z-10 relative">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!roadmapData) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center z-10 relative">
        <div className="text-center glass-panel p-10 rounded-3xl border border-white/10 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-3">Roadmap Not Found</h2>
          <p className="text-slate-400 mb-6">We couldn't find this study plan in your account.</p>
          <button
            onClick={() => navigate('/roadmaps')}
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all cursor-pointer"
          >
            Back to Roadmaps
          </button>
        </div>
      </div>
    )
  }

  let rawSyllabus = roadmapData.customized_syllabus
  if (typeof rawSyllabus === 'string') {
    try {
      rawSyllabus = JSON.parse(rawSyllabus)
    } catch (e) {
      console.error("Failed to parse syllabus string", e)
    }
  }

  // Normalization to handle all legacy data shapes
  let subjectsArray = [];
  if (Array.isArray(rawSyllabus)) {
    if (rawSyllabus.length > 0 && rawSyllabus[0].topics) {
      // It's an array of modules
      subjectsArray = [{ subject_name: "Legacy Roadmap", modules: rawSyllabus }];
    } else {
      // It's an array of subjects
      subjectsArray = rawSyllabus;
    }
  } else if (rawSyllabus?.modules) {
    // It's a single subject object
    subjectsArray = [rawSyllabus];
  } else {
    subjectsArray = [{ subject_name: "Empty Roadmap", modules: [] }];
  }

  const roadmap = subjectsArray[subjectIndex] || subjectsArray[0]

  if (!roadmap || !roadmap.modules) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center z-10 relative text-white">
        <p>Invalid roadmap data format.</p>
      </div>
    )
  }

  const totalTopics = roadmap.modules.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0)
  const completedCount = Object.values(progressState).filter((s) => s === 'done').length
  const progress = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0

  const handleStatusChange = async (topicTitle: string, newStatus: string) => {
    if (!user?.id || !roadmapData.id) return
    setProgressState((prev) => ({ ...prev, [topicTitle]: newStatus }))
    try {
      await updateTopicProgress(user.id, roadmapData.id, { topic_title: topicTitle, status: newStatus })
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col md:flex-row z-10">
      <div ref={containerRef} className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 mt-4 disable-scrollbar">
        {/* Header / Progress */}
        <div className="max-w-3xl mx-auto mb-16 pt-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-sans tracking-tight">{roadmap.subject_name}</h1>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium">Your Progress</span>
            <span className="font-bold text-indigo-400 text-xl">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Tree Layout */}
        <div className="max-w-3xl mx-auto relative mt-10">
          <div className="absolute left-8 lg:left-1/2 top-4 bottom-4 w-1 bg-linear-to-b from-indigo-500/50 via-purple-500/50 to-transparent lg:-translate-x-1/2 rounded-full" />

          {roadmap.modules.map((mod: any, i: number) => (
            <div key={i} className="mb-20 relative w-full flex flex-col lg:flex-row items-start lg:items-center justify-center">
              {/* Module Node */}
              <div className="absolute left-8 lg:left-1/2 top-0 lg:top-1/2 -translate-x-[45%] lg:-translate-x-1/2 translate-y-0 lg:-translate-y-1/2 z-10">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center font-bold text-md lg:text-lg border-2 border-indigo-400">
                  {mod.module_number.replace('M', '')}
                </div>
              </div>

              {/* Module Title Box */}
              <div className="w-full lg:w-1/2 pr-0 lg:pr-16 pl-20 lg:pl-0 mt-2 lg:mt-0 text-left lg:text-right">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ root: containerRef, once: true, margin: '0px 0px -50px 0px' }}
                  className="glass-panel p-5 rounded-2xl border border-white/10"
                >
                  <h2 className="text-xl font-bold text-white mb-1">{mod.title}</h2>
                  <p className="text-slate-400 text-sm">{mod.topics.length} topics</p>
                </motion.div>
              </div>

              {/* Topics List */}
              <div className="w-full lg:w-1/2 pl-20 lg:pl-16 mt-10 lg:mt-0">
                <div className="flex flex-col gap-4 relative">
                  {mod.topics.map((topic: any, j: number) => {
                    const status = progressState[topic.title] || 'pending'
                    const isDone = status === 'done'
                    const isOngoing = status === 'ongoing'
                    const isSkipped = status === 'skipped'

                    let bgClass = "bg-white/5 border-white/5 hover:border-indigo-500/50 hover:bg-white/10"
                    if (isDone) bgClass = "bg-green-500/10 border-green-500/30"
                    else if (isOngoing) bgClass = "bg-amber-500/10 border-amber-500/30"
                    else if (isSkipped) bgClass = "bg-slate-500/10 border-slate-500/30 opacity-60"

                    return (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ root: containerRef, once: true, margin: '0px 0px -20px 0px' }}
                        transition={{ delay: j * 0.1 }}
                        onClick={() => setSelectedTopic(topic)}
                        className={`group relative p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${bgClass}`}
                      >
                        <div className="absolute top-1/2 -left-12 w-12 h-0 border-t-2 border-dashed border-indigo-500/30 -translate-y-1/2 group-hover:border-indigo-500/60 transition-colors" />

                        <div className="flex items-center gap-3 pr-2">
                          <div
                            className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-green-500 border-green-500' :
                              isOngoing ? 'bg-amber-500 border-amber-500' :
                                isSkipped ? 'bg-slate-500 border-slate-500' :
                                  'border-slate-500 group-hover:border-indigo-400'
                              }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                            {isOngoing && <div className="w-2 h-2 rounded-full bg-white" />}
                            {isSkipped && <div className="w-3 h-0.5 bg-white" />}
                          </div>
                          <span className={`font-medium text-sm lg:text-base ${isDone || isSkipped ? 'text-slate-400 line-through' : (isOngoing ? 'text-amber-100' : 'text-white')}`}>
                            {topic.title}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar for Topic Detail */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full md:w-96 bg-slate-950/90 backdrop-blur-3xl border-l border-white/10 h-screen fixed md:relative right-0 top-0 z-50 p-6 flex flex-col shadow-2xl"
          >
            <button
              onClick={() => setSelectedTopic(null)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-8 flex-1 overflow-y-auto disable-scrollbar pr-2 relative">

              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Topic Details</span>

              <h3 className="text-2xl font-bold text-white mb-4 pr-8 leading-tight">{selectedTopic.title}</h3>

              {selectedTopic.description && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedTopic.description}</p>
                </div>
              )}

              <div className="mb-8 relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
                <div className="relative w-full">
                  <select
                    value={progressState[selectedTopic.title] || 'pending'}
                    onChange={(e) => handleStatusChange(selectedTopic.title, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="pending" className="bg-slate-900 text-slate-300">Pending</option>
                    <option value="ongoing" className="bg-slate-900 text-amber-400">Ongoing</option>
                    <option value="skipped" className="bg-slate-900 text-slate-500">Skipped</option>
                    <option value="done" className="bg-slate-900 text-green-400">Done</option>
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronRight className="w-4 h-4 text-slate-500 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 mt-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-purple-400" /> Recommended Video
                  </h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 cursor-pointer transition-colors group">
                    <p className="text-sm font-medium group-hover:text-purple-300 transition-colors line-clamp-1">Crash Course: {selectedTopic.title}</p>
                    <span className="text-xs text-slate-500 mt-1 block">YouTube • ~12 mins</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" /> Reading Material
                  </h4>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-colors group">
                    <p className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Core Concepts Guide</p>
                    <span className="text-xs text-slate-500 mt-1 block">Article • 5 min read</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 pb-20 md:pb-0">
              <button
                onClick={() => navigate(`/quiz/session?topic=${encodeURIComponent(selectedTopic.title)}&plan_id=${roadmapData.id}`)}
                className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate Topic Quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Tutor Bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center text-white z-40 cursor-pointer"
      >
        <Bot className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
