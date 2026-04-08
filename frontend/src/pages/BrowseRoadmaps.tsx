import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Map, ChevronRight, Loader2 } from 'lucide-react'
import { getUserRoadmaps } from '../lib/api'
import type { UserRoadmap } from '../lib/api'
import { useStore } from '../store/useStore'

const CATEGORIES = ["All", "Recent", "Favorites"]

const COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-purple-500 to-fuchsia-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-red-500 to-rose-600",
]

export default function BrowseRoadmaps() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [roadmaps, setRoadmaps] = useState<UserRoadmap[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useStore()

  useEffect(() => {
    async function loadRoadmaps() {
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      try {
        const response = await getUserRoadmaps(user.id)
        setRoadmaps(response.data || [])
      } catch (err) {
        console.error("Failed to fetch roadmaps:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadRoadmaps()
  }, [user?.id])

  const allSubjects = roadmaps.flatMap(rm => {
    if (!rm.customized_syllabus) return [];

    let rawSyllabus = rm.customized_syllabus;
    if (typeof rawSyllabus === 'string') {
      try {
        rawSyllabus = JSON.parse(rawSyllabus);
      } catch (e) {
        console.error("Failed to parse syllabus string", e);
      }
    }

    // Normalization to handle all legacy data shapes
    let subjectsArray: any[] = [];
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

    return subjectsArray.map((subj, index) => ({
      plan_id: rm.id,
      subject_index: index,
      subject: subj,
      created_at: rm.created_at
    }));
  });

  const filteredSubjects = allSubjects.filter(item => {
    const title = item.subject?.subject_name || "Untitled Roadmap"
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="w-full min-h-[85vh] p-6 max-w-7xl mx-auto relative z-10 flex flex-col">
      <div className="mb-12 mt-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans tracking-tight">Your Roadmaps</h1>
        <p className="text-slate-400 text-lg max-w-2xl">Access your generated and customized learning paths here.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search your roadmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeCategory === cat
                ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSubjects.map((item, idx) => {
              const syllabus = item.subject
              const title = syllabus?.subject_name || "Untitled Roadmap"
              const topicsCount = syllabus?.modules?.reduce((acc: number, mod: any) => acc + (mod.topics?.length || 0), 0) || 0
              const color = COLORS[idx % COLORS.length]

              return (
                <motion.div
                  key={`${item.plan_id}-${item.subject_index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/roadmap/${item.plan_id}?subjectIndex=${item.subject_index}`}
                    className="group block h-64 rounded-3xl p-px bg-linear-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all cursor-pointer"
                  >
                    <div className="w-full h-full rounded-[23px] bg-slate-900 p-6 flex flex-col relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${color} opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity`}></div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/5 text-xs font-semibold text-slate-300">
                            Custom
                          </span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 pr-4 line-clamp-2">{title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Map className="w-4 h-4" />
                          <span>{topicsCount} Topics</span>
                        </div>
                      </div>

                      <div className="flex justify-end relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg">
                          <ChevronRight className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredSubjects.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Map className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-xl text-slate-400 font-medium mb-2">No roadmaps found</p>
              <p className="text-slate-500 max-w-sm">Upload your university syllabus to generate your first personalized roadmap.</p>
              <Link to="/generate" className="mt-8 px-6 py-3 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-all">
                Generate Roadmap
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
