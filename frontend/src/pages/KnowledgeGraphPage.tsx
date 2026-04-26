import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Flame, Zap, Search, Grid3X3, List, Lock, Loader2, LogIn } from 'lucide-react'
import AssessmentDrawer from '../components/ui/AssessmentDrawer'
import WeakTopicBanner from '../components/ui/WeakTopicBanner'
import type { ConceptCluster, Track } from '../types'
import { useStore } from '../store/useStore'
import { getUserRoadmaps } from '../lib/api'
import type { UserRoadmap } from '../lib/api'

// ── Demo data for guests ──────────────────────────────────────────────────────
const DEMO_CLUSTERS: ConceptCluster[] = [
    { id: 'd1', label: 'Arrays & Strings', module_ref: 'Data Structures', bloom_depth: 'Understand', difficulty_avg: 2.5, mastery_score: 1.0, mastery_state: 'mastered', order_index: 1 },
    { id: 'd2', label: 'Linked Lists', module_ref: 'Data Structures', bloom_depth: 'Apply', difficulty_avg: 3.0, mastery_score: 0.85, mastery_state: 'mastered', order_index: 2 },
    { id: 'd3', label: 'Stacks & Queues', module_ref: 'Data Structures', bloom_depth: 'Apply', difficulty_avg: 3.0, mastery_score: 0.7, mastery_state: 'mastered', order_index: 3 },
    { id: 'd4', label: 'Hash Tables', module_ref: 'Data Structures', bloom_depth: 'Analyze', difficulty_avg: 3.5, mastery_score: 0.5, mastery_state: 'in_progress', order_index: 4 },
    { id: 'd5', label: 'Recursion', module_ref: 'Algorithms', bloom_depth: 'Apply', difficulty_avg: 4.0, mastery_score: 0.6, mastery_state: 'in_progress', order_index: 5 },
    { id: 'd6', label: 'Binary Trees', module_ref: 'Data Structures', bloom_depth: 'Analyze', difficulty_avg: 4.0, mastery_score: 0.35, mastery_state: 'in_progress', order_index: 6 },
    { id: 'd7', label: 'Sorting Algorithms', module_ref: 'Algorithms', bloom_depth: 'Understand', difficulty_avg: 3.0, mastery_score: 0.0, mastery_state: 'available', order_index: 7 },
    { id: 'd8', label: 'Graph Traversal', module_ref: 'Algorithms', bloom_depth: 'Analyze', difficulty_avg: 4.5, mastery_score: 0.0, mastery_state: 'available', order_index: 8 },
    { id: 'd9', label: 'Dynamic Programming', module_ref: 'Algorithms', bloom_depth: 'Analyze', difficulty_avg: 5.0, mastery_score: 0.0, mastery_state: 'available', order_index: 9 },
    { id: 'd10', label: 'Greedy Algorithms', module_ref: 'Algorithms', bloom_depth: 'Apply', difficulty_avg: 3.5, mastery_score: 0.0, mastery_state: 'available', order_index: 10 },
    { id: 'd11', label: 'Heaps & Priority Queues', module_ref: 'Data Structures', bloom_depth: 'Apply', difficulty_avg: 4.0, mastery_score: 0.0, mastery_state: 'locked', order_index: 11 },
    { id: 'd12', label: 'Tries & Advanced Trees', module_ref: 'Data Structures', bloom_depth: 'Analyze', difficulty_avg: 5.0, mastery_score: 0.0, mastery_state: 'locked', order_index: 12 },
]

// ── Node Colors ───────────────────────────────────────────────────────────────
const nodeColor: Record<string, string> = {
    locked: 'bg-slate-700 border-slate-600 text-slate-500',
    available: 'bg-blue-500/10 border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]',
    in_progress: 'bg-amber-500/10 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(217,119,6,0.25)]',
    mastered: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(5,150,105,0.25)]',
}

const nodeDot: Record<string, string> = {
    locked: 'bg-slate-600',
    available: 'bg-blue-400',
    in_progress: 'bg-amber-400',
    mastered: 'bg-emerald-400',
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
function KnowledgeHeatmap() {
    const weeks = Array.from({ length: 15 })
    const days = Array.from({ length: 7 })
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    return (
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex-1">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" /> Quiz Activity
            </h3>
            <div className="flex gap-1.5">
                <div className="flex flex-col gap-1.5 mr-1">
                    {dayLabels.map(d => (
                        <div key={d} className="w-3 h-3 text-[8px] text-slate-600 flex items-center">{d}</div>
                    ))}
                </div>
                {weeks.map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        {days.map((_, j) => {
                            const val = Math.random()
                            const bg = val > 0.8 ? 'bg-indigo-500' : val > 0.55 ? 'bg-indigo-500/60' : val > 0.3 ? 'bg-indigo-500/30' : 'bg-white/5'
                            return (
                                <motion.div
                                    key={j}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: (i * 7 + j) * 0.004 }}
                                    className={`w-3 h-3 rounded-[2px] ${bg}`}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function KnowledgeGraphPage() {
    const { user } = useStore()
    const navigate = useNavigate()
    const [roadmaps, setRoadmaps] = useState<UserRoadmap[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [activeTrack, setActiveTrack] = useState<string>('')
    const [selectedCluster, setSelectedCluster] = useState<ConceptCluster | null>(null)
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    const isGuest = !user?.id

    useEffect(() => {
        async function loadRoadmaps() {
            if (!user?.id) {
                setIsLoading(false)
                return
            }
            try {
                const response = await getUserRoadmaps(user.id)
                setRoadmaps(response.data || [])
            } catch (error) {
                console.error('Failed to load roadmaps:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadRoadmaps()
    }, [user?.id])

    const allSubjects = useMemo(() => {
        return roadmaps.flatMap(rm => {
            if (!rm.customized_syllabus) return [];

            let rawSyllabus = rm.customized_syllabus;
            if (typeof rawSyllabus === 'string') {
                try { rawSyllabus = JSON.parse(rawSyllabus); } catch (e) { }
            }

            let subjectsArray = [];
            if (Array.isArray(rawSyllabus)) {
                if (rawSyllabus.length > 0 && rawSyllabus[0].topics) {
                    subjectsArray = [{ subject_name: "Legacy Roadmap", modules: rawSyllabus }];
                } else {
                    subjectsArray = rawSyllabus;
                }
            } else if (rawSyllabus?.modules) {
                subjectsArray = [rawSyllabus];
            } else {
                subjectsArray = [{ subject_name: "Empty Roadmap", modules: [] }];
            }

            return subjectsArray.map((subj, index) => ({
                id: `${rm.id}-${index}`,
                plan_id: rm.id,
                subject_name: subj.subject_name || "Untitled",
                modules: subj.modules || [],
                progress_state: rm.progress_state || {}
            }))
        })
    }, [roadmaps])

    useEffect(() => {
        if (allSubjects.length > 0 && !activeTrack) {
            setActiveTrack(allSubjects[0].id)
        }
    }, [allSubjects, activeTrack])

    const clusters = useMemo(() => {
        const currentSubject = allSubjects.find(s => s.id === activeTrack)
        if (!currentSubject) return []

        return currentSubject.modules.flatMap((mod: any, modIdx: number) =>
            (mod.topics || []).map((topic: any, topicIdx: number) => {
                const title = topic.title || ''
                const state = currentSubject.progress_state[title] || 'pending'

                let mastery_state = 'locked'
                let mastery_score = 0

                if (state === 'done') {
                    mastery_state = 'mastered'
                    mastery_score = 1.0
                } else if (state === 'ongoing') {
                    mastery_state = 'in_progress'
                    mastery_score = 0.5
                } else if (state === 'skipped') {
                    mastery_state = 'available'
                    mastery_score = 0.0
                } else {
                    mastery_state = 'available' // Treat pending as available in the graph
                }

                return {
                    id: `${modIdx}-${topicIdx}`,
                    label: title,
                    module_ref: mod.title || mod.module_number || `Module ${modIdx + 1}`,
                    bloom_depth: 'Understand',
                    difficulty_avg: 3.0,
                    mastery_score,
                    mastery_state,
                    order_index: modIdx * 100 + topicIdx,
                    plan_id: currentSubject.plan_id
                } as ConceptCluster
            })
        )
    }, [allSubjects, activeTrack])
    const weakClusters = clusters
        .filter((c: ConceptCluster) => c.mastery_state === 'in_progress' && c.mastery_score < 0.5)
        .sort((a: ConceptCluster, b: ConceptCluster) => a.mastery_score - b.mastery_score)

    const filtered = clusters.filter((c: ConceptCluster) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.module_ref.toLowerCase().includes(search.toLowerCase())
    )

    const handleStartQuiz = (_clusterId: string, nodeTopic: string = '', planId: string = '') => {
        setSelectedCluster(null)
        if (nodeTopic && planId) {
            navigate(`/quiz/session?topic=${encodeURIComponent(nodeTopic)}&plan_id=${planId}`)
        } else {
            navigate(`/quiz/session`)
        }
    }

    const handleRevisit = (clusterId: string) => {
        const cluster = clusters.find((c: ConceptCluster) => c.id === clusterId) ?? null
        setSelectedCluster(cluster)
    }

    const stats = {
        mastered: clusters.filter((c: ConceptCluster) => c.mastery_state === 'mastered').length,
        inProgress: clusters.filter((c: ConceptCluster) => c.mastery_state === 'in_progress').length,
        available: clusters.filter((c: ConceptCluster) => c.mastery_state === 'available').length,
        total: clusters.length,
    }

    const totalXP = 1350

    if (isLoading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center pt-24 bg-slate-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    // In guest mode or no roadmaps → use demo clusters
    const effectiveClusters = (isGuest || allSubjects.length === 0) ? DEMO_CLUSTERS : clusters
    const effectiveWeakClusters = effectiveClusters
        .filter((c: ConceptCluster) => c.mastery_state === 'in_progress' && c.mastery_score < 0.5)
        .sort((a: ConceptCluster, b: ConceptCluster) => a.mastery_score - b.mastery_score)
    const effectiveFiltered = effectiveClusters.filter((c: ConceptCluster) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.module_ref.toLowerCase().includes(search.toLowerCase())
    )
    const effectiveStats = {
        mastered: effectiveClusters.filter((c: ConceptCluster) => c.mastery_state === 'mastered').length,
        inProgress: effectiveClusters.filter((c: ConceptCluster) => c.mastery_state === 'in_progress').length,
        available: effectiveClusters.filter((c: ConceptCluster) => c.mastery_state === 'available').length,
        total: effectiveClusters.length,
    }

    return (
        <div className="w-full min-h-screen p-6 max-w-7xl mx-auto relative z-10 pt-24">

            {/* Guest / demo banner */}
            {(isGuest || allSubjects.length === 0) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 flex items-center justify-between gap-4 backdrop-blur-sm"
                >
                    <div>
                        <p className="text-sm font-semibold text-indigo-300">📊 Demo Mode — Exploring with sample data</p>
                        <p className="text-xs text-slate-400 mt-0.5">Sign in and upload a syllabus to see your real knowledge graph</p>
                    </div>
                    <Link
                        to="/signup"
                        className="shrink-0 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <LogIn className="w-4 h-4" /> Sign Up
                    </Link>
                </motion.div>
            )}

            {/* ── Top bar ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">Knowledge Graph</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Explore and assess your concept mastery</p>
                </div>

                {/* Mode switcher */}
                {allSubjects.length > 0 && (
                    <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar snap-x max-w-[50vw]">
                        {allSubjects.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveTrack(s.id)}
                                className={`snap-start shrink-0 relative px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${activeTrack === s.id ? 'text-white' : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10'
                                    }`}
                            >
                                {activeTrack === s.id && (
                                    <motion.div
                                        layoutId="track-pill"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-500/30"
                                    />
                                )}
                                <span className="relative z-10">{s.subject_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Weak cluster banner */}
            <WeakTopicBanner weakClusters={effectiveWeakClusters} onRevisit={handleRevisit} />

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Mastered', val: effectiveStats.mastered, color: 'text-emerald-400', dot: 'bg-emerald-400' },
                    { label: 'In Progress', val: effectiveStats.inProgress, color: 'text-amber-400', dot: 'bg-amber-400' },
                    { label: 'Available', val: effectiveStats.available, color: 'text-blue-400', dot: 'bg-blue-400' },
                    { label: 'Total', val: effectiveStats.total, color: 'text-purple-400', dot: 'bg-purple-400' },
                ].map(s => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.05 * [
                                { label: 'Mastered' }, { label: 'In Progress' }, { label: 'Available' }, { label: 'Total' }
                            ].findIndex(x => x.label === s.label)
                        }}
                        className="glass-panel rounded-2xl p-4 border border-white/5 hover:border-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{s.label}</span>
                        </div>
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── XP / Heatmap row ── */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* XP card */}
                <div className="glass-panel p-5 rounded-3xl border border-white/10 md:w-64 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">XP</span>
                    </div>
                    <p className="text-3xl font-extrabold text-white">{totalXP.toLocaleString()}</p>
                    <div className="w-full h-1.5 rounded-full bg-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(totalXP / 2000) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                        />
                    </div>
                    <p className="text-slate-500 text-xs">Learner · {2000 - totalXP} XP to Practitioner</p>
                </div>

                <KnowledgeHeatmap />
            </div>

            {/* ── Search + view toggle ── */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search clusters..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    />
                </div>
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Legend ── */}
            <div className="flex flex-wrap gap-4 mb-5 text-xs text-slate-500">
                {[
                    { state: 'mastered', label: 'Mastered', color: 'bg-emerald-400' },
                    { state: 'in_progress', label: 'In Progress', color: 'bg-amber-400' },
                    { state: 'available', label: 'Available', color: 'bg-blue-400' },
                    { state: 'locked', label: 'Locked', color: 'bg-slate-600' },
                ].map(l => (
                    <div key={l.state} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${l.color}`} />
                        {l.label}
                    </div>
                ))}
            </div>

            {/* ── Node grid ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTrack + viewMode}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={viewMode === 'grid'
                        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-24'
                        : 'flex flex-col gap-2 pb-24'}
                >
                    {effectiveFiltered.map((c: ConceptCluster, i: number) => (
                        <motion.button
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                            whileHover={c.mastery_state !== 'locked' ? { scale: 1.03, y: -2 } : undefined}
                            whileTap={c.mastery_state !== 'locked' ? { scale: 0.97 } : undefined}
                            disabled={c.mastery_state === 'locked'}
                            onClick={() => setSelectedCluster(c)}
                            className={`relative border rounded-2xl text-left transition-all duration-200 ${nodeColor[c.mastery_state]} ${viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-4'
                                } ${c.mastery_state !== 'locked' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        >
                            {viewMode === 'grid' ? (
                                <>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`w-2.5 h-2.5 rounded-full ${nodeDot[c.mastery_state]}`} />
                                        {c.mastery_state === 'locked' && <Lock className="w-3.5 h-3.5 opacity-40" />}
                                    </div>
                                    <p className="text-sm font-semibold leading-snug mb-2">{c.label}</p>
                                    <p className="text-xs opacity-50">{c.module_ref}</p>
                                    {c.mastery_score > 0 && (
                                        <div className="mt-3 w-full h-1 rounded-full bg-white/10">
                                            <div
                                                className={`h-full rounded-full ${nodeDot[c.mastery_state]}`}
                                                style={{ width: `${c.mastery_score * 100}%` }}
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${nodeDot[c.mastery_state]}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{c.label}</p>
                                        <p className="text-xs opacity-50">{c.module_ref}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-xs opacity-50">
                                        {c.mastery_score > 0 ? `${Math.round(c.mastery_score * 100)}%` : '—'}
                                    </div>
                                    {c.mastery_state === 'locked' && <Lock className="w-3.5 h-3.5 opacity-30 flex-shrink-0" />}
                                </>
                            )}
                        </motion.button>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Assessment Drawer */}
            <AssessmentDrawer
                cluster={selectedCluster}
                onClose={() => setSelectedCluster(null)}
                onStartQuiz={handleStartQuiz}
            />
        </div>
    )
}
