import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, TrendingUp, Tag, TriangleAlert } from 'lucide-react'
import type { ConceptCluster } from '../../types'

interface Props {
    cluster: ConceptCluster | null
    onClose: () => void
    onStartQuiz: (clusterId: string) => void
}

const masteryColor: Record<string, string> = {
    locked: 'bg-slate-500',
    available: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    mastered: 'bg-emerald-500',
}

const masteryLabel: Record<string, string> = {
    locked: 'Locked',
    available: 'Available',
    in_progress: 'In Progress',
    mastered: 'Mastered',
}

const masteryTextColor: Record<string, string> = {
    locked: 'text-slate-400',
    available: 'text-blue-400',
    in_progress: 'text-amber-400',
    mastered: 'text-emerald-400',
}

export default function AssessmentDrawer({ cluster, onClose, onStartQuiz }: Props) {
    return (
        <AnimatePresence>
            {cluster && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.aside
                        key="drawer"
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 h-full w-full max-w-sm z-40 bg-slate-950/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-white/5">
                            <div className="flex-1 pr-4">
                                <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${masteryTextColor[cluster.mastery_state]} bg-white/5 border border-white/10`}>
                                    {masteryLabel[cluster.mastery_state]}
                                </span>
                                <h2 className="text-xl font-bold text-white leading-tight">{cluster.label}</h2>
                                <p className="text-slate-500 text-sm mt-1">{cluster.module_ref}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Mastery bar */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4" /> Mastery
                                    </span>
                                    <span className="text-sm font-bold text-white">{Math.round(cluster.mastery_score * 100)}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cluster.mastery_score * 100}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${masteryColor[cluster.mastery_state]}`}
                                    />
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-slate-500 text-xs mb-1">Bloom Level</p>
                                    <p className="text-white font-semibold text-sm">{cluster.bloom_depth}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-slate-500 text-xs mb-1">Avg Difficulty</p>
                                    <p className="text-white font-semibold text-sm">{cluster.difficulty_avg.toFixed(1)} / 5.0</p>
                                </div>
                            </div>

                            {/* Weakness tags */}
                            {cluster.weakness_tags && cluster.weakness_tags.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-slate-400 flex items-center gap-1.5 mb-3">
                                        <TriangleAlert className="w-4 h-4 text-amber-400" /> Weak Sub-topics
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {cluster.weakness_tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium"
                                            >
                                                <Tag className="w-3 h-3" /> {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cluster.mastery_state === 'locked' && (
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 text-center">
                                    <p className="text-slate-400 text-sm">
                                        Complete prerequisite clusters to unlock this topic.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer: Start Quiz */}
                        <div className="p-6 border-t border-white/5">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={cluster.mastery_state === 'locked'}
                                onClick={() => onStartQuiz(cluster.id)}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
                            >
                                <Play className="w-5 h-5" fill="currentColor" /> Start Quiz
                            </motion.button>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
