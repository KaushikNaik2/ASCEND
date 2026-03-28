import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Trophy, TrendingUp, Zap, RotateCcw, Map, Check, X } from 'lucide-react'
import type { QuizQuestion } from '../types'

interface LocationState {
    answers: (number | null)[]
    questions: QuizQuestion[]
}

const VECTOR_DELTAS = [
    { label: 'Recursion Basics', before: 0.45, after: 0.62 },
    { label: 'Memoization', before: 0.22, after: 0.38 },
    { label: 'Tree Traversal', before: 0.30, after: 0.41 },
]

export default function QuizResultsPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const state = location.state as LocationState | null

    const questions: QuizQuestion[] = state?.questions ?? []
    const answers: (number | null)[] = state?.answers ?? []

    const score = answers.reduce<number>((acc, ans, i) =>
        ans === questions[i]?.correct_index ? acc + 1 : acc, 0)
    const total = questions.length || 5
    const pct = Math.round((score / total) * 100)
    const xpEarned = score * 20 + (pct === 100 ? 50 : 0)

    const [animatedPct, setAnimatedPct] = useState(0)
    const [xpAnim, setXpAnim] = useState(0)
    const [showDeltas, setShowDeltas] = useState(false)

    useEffect(() => {
        const t1 = setTimeout(() => setAnimatedPct(pct), 300)
        const t2 = setTimeout(() => setXpAnim(xpEarned), 600)
        const t3 = setTimeout(() => setShowDeltas(true), 900)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [])

    const grade =
        pct >= 90 ? { label: 'Excellent', color: 'from-emerald-400 to-cyan-400', icon: '🏆' } :
            pct >= 70 ? { label: 'Good', color: 'from-blue-400 to-indigo-400', icon: '⭐' } :
                pct >= 50 ? { label: 'Fair', color: 'from-amber-400 to-orange-400', icon: '📈' } :
                    { label: 'Keep Going', color: 'from-rose-400 to-pink-400', icon: '💪' }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
            <div className="w-full max-w-2xl space-y-5">

                {/* ── Score hero ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="glass-panel p-8 rounded-3xl border border-white/10 text-center relative overflow-hidden"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${grade.color} opacity-5 pointer-events-none`} />

                    <div className="text-5xl mb-3">{grade.icon}</div>
                    <h1 className={`text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${grade.color} mb-1`}>
                        {grade.label}
                    </h1>
                    <p className="text-slate-500 text-sm mb-8">Recursion &amp; Backtracking · {total} questions</p>

                    {/* Radial score */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="64" cy="64" r="56" className="stroke-white/5" strokeWidth="8" fill="none" />
                            <motion.circle
                                cx="64" cy="64" r="56"
                                stroke="url(#scoreGrad)"
                                strokeWidth="8" fill="none"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 56}
                                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - animatedPct / 100) }}
                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                            />
                            <defs>
                                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold text-white">{score}/{total}</span>
                            <span className="text-slate-500 text-xs">{pct}%</span>
                        </div>
                    </div>

                    {/* XP Award */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-500/10 border border-yellow-500/30"
                    >
                        <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
                        <span className="text-yellow-300 font-bold">+{xpAnim} XP earned</span>
                    </motion.div>
                </motion.div>

                {/* ── Answer breakdown ── */}
                {questions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-panel p-6 rounded-3xl border border-white/10"
                    >
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-indigo-400" /> Answer Breakdown
                        </h2>
                        <div className="space-y-2">
                            {questions.map((q, i) => {
                                const correct = answers[i] === q.correct_index
                                return (
                                    <div key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border ${correct ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-red-500/15 bg-red-500/5'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${correct ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                            {correct
                                                ? <Check className="w-3 h-3 text-emerald-400" />
                                                : <X className="w-3 h-3 text-red-400" />}
                                        </div>
                                        <p className="text-sm text-slate-300 leading-snug">{q.text}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Vector delta ── */}
                {showDeltas && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6 rounded-3xl border border-white/10"
                    >
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> Knowledge Vector Updated
                        </h2>
                        <div className="space-y-4">
                            {VECTOR_DELTAS.map((d, i) => {
                                const delta = Math.round((d.after - d.before) * 100)
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-sm text-slate-300">{d.label}</span>
                                            <span className="text-xs font-bold text-emerald-400">+{delta}%</span>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden relative">
                                                {/* Before */}
                                                <div className="absolute h-full rounded-full bg-slate-600" style={{ width: `${d.before * 100}%` }} />
                                                {/* After */}
                                                <motion.div
                                                    initial={{ width: `${d.before * 100}%` }}
                                                    animate={{ width: `${d.after * 100}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: 0.1 * i }}
                                                    className="absolute h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500 w-8 text-right">{Math.round(d.after * 100)}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── CTAs ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3"
                >
                    <button
                        onClick={() => navigate('/quiz/c3')}
                        className="flex-1 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" /> Retake Quiz
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/graph')}
                        className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
                    >
                        <Map className="w-4 h-4" /> Back to Graph
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}
