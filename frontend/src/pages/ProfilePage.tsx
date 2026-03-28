import { motion } from 'framer-motion'
import { Flame, Award, BookOpen, Cpu, Upload, Calendar } from 'lucide-react'
import XPLevelBadge from '../components/ui/XPLevelBadge'
import type { Badge } from '../types'

const MOCK_BADGES: Badge[] = [
    { id: 'b1', title: 'First Upload', description: 'Uploaded your first syllabus PDF', icon: '📄', earned_at: '2026-01-12' },
    { id: 'b2', title: 'Week Warrior', description: 'Maintained a 7-day streak', icon: '🔥', earned_at: '2026-01-19' },
    { id: 'b3', title: 'Graph Explorer', description: 'Visited 10+ concept clusters', icon: '🗺️', earned_at: '2026-02-02' },
    { id: 'b4', title: 'Forge Ignited', description: 'Completed first FORGE quiz', icon: '⚡', earned_at: '2026-02-14' },
    { id: 'b5', title: 'Perfect Score', description: 'Got 100% on a quiz session', icon: '🎯', earned_at: '2026-03-01' },
    { id: 'b6', title: '5 Unique Subjects', description: 'Uploaded 5 unique subject syllabi', icon: '📚', earned_at: undefined }, // locked
]

const MOCK_CROSS_UNLOCKS = [
    { academic: 'SQL in Data Management (DBMS)', forge: 'SQL Basics (Database Engineering)', unlocked: true },
    { academic: 'Sorting Algorithms (DSA)', forge: 'Arrays & Strings (DSA)', unlocked: true },
    { academic: 'Linear Algebra', forge: 'AI/ML Fundamentals', unlocked: false },
]

function StreakCalendar({ streakDays }: { streakDays: number }) {
    const weeks = Array.from({ length: 15 })
    const days = Array.from({ length: 7 })

    return (
        <div className="glass-panel p-5 rounded-3xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Activity Calendar
                </h3>
                <div className="flex items-center gap-1.5 text-orange-400 font-bold text-sm">
                    <Flame className="w-4 h-4" /> {streakDays} day streak
                </div>
            </div>
            <div className="flex gap-1.5">
                {weeks.map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        {days.map((_, j) => {
                            const v = Math.random()
                            const bg = v > 0.75 ? 'bg-indigo-500' : v > 0.5 ? 'bg-indigo-500/60' : v > 0.25 ? 'bg-indigo-500/25' : 'bg-white/5'
                            return (
                                <motion.div
                                    key={j}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: (i * 7 + j) * 0.003 }}
                                    className={`w-3 h-3 rounded-[2px] ${bg}`}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                <span>Less</span>
                {['bg-white/5', 'bg-indigo-500/25', 'bg-indigo-500/60', 'bg-indigo-500'].map(c => (
                    <div key={c} className={`w-3 h-3 rounded-[2px] ${c}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const xp = 4350
    const streakDays = 12

    return (
        <div className="w-full min-h-screen p-6 max-w-4xl mx-auto relative z-10 pt-24">

            {/* ── Profile hero ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 mb-5 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        A
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-extrabold text-white">Alex You</h1>
                        <p className="text-slate-400 text-sm mt-0.5">Mumbai University · Joined Jan 2026</p>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
                                <BookOpen className="w-3.5 h-3.5" /> Academic Active
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                                <Cpu className="w-3.5 h-3.5" /> FORGE Active
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                                <Upload className="w-3.5 h-3.5" /> Contributor
                            </span>
                        </div>
                    </div>
                    <div className="md:w-64">
                        <XPLevelBadge xp={xp} />
                    </div>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-5">
                {/* Left column */}
                <div className="space-y-5">
                    {/* Streak calendar */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <StreakCalendar streakDays={streakDays} />
                    </motion.div>

                    {/* Cross-track unlocks */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="glass-panel p-5 rounded-3xl border border-white/10"
                    >
                        <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                            <span className="text-indigo-400">⚡</span> Cross-Track Unlocks
                        </h3>
                        <div className="space-y-3">
                            {MOCK_CROSS_UNLOCKS.map((u, i) => (
                                <div key={i} className={`p-3 rounded-2xl border transition-all ${u.unlocked ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-white/3 opacity-50'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                        <p className="text-xs text-slate-400 truncate">{u.academic}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                        <p className="text-xs text-slate-300 truncate">{u.forge}</p>
                                        {u.unlocked && <span className="ml-auto text-emerald-400 text-xs font-bold flex-shrink-0">Unlocked</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right column: Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="glass-panel p-5 rounded-3xl border border-white/10 h-fit"
                >
                    <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" /> Badges
                        <span className="ml-auto text-xs text-slate-500">{MOCK_BADGES.filter(b => b.earned_at).length} / {MOCK_BADGES.length}</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {MOCK_BADGES.map((badge, i) => (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: badge.earned_at ? 1 : 0.4, scale: 1 }}
                                transition={{ delay: 0.05 * i }}
                                className={`p-4 rounded-2xl border text-center transition-all ${badge.earned_at
                                        ? 'border-white/10 bg-white/5 hover:border-white/20'
                                        : 'border-white/5 bg-white/3 grayscale cursor-not-allowed'
                                    }`}
                            >
                                <div className="text-3xl mb-2">{badge.icon}</div>
                                <p className="text-xs font-bold text-white mb-0.5 leading-tight">{badge.title}</p>
                                <p className="text-[10px] text-slate-500 leading-tight">{badge.description}</p>
                                {badge.earned_at && (
                                    <p className="text-[10px] text-indigo-400 mt-1.5">
                                        {new Date(badge.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
