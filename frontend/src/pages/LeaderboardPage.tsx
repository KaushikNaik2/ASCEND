import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Crown, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { getLeaderboard } from '../lib/api'
import type { LeaderboardEntryResponse } from '../lib/api'

interface LeaderEntry extends LeaderboardEntryResponse {
    is_current_user?: boolean
}

const RANK_COLORS = ['text-yellow-400', 'text-slate-400', 'text-amber-600']
const RANK_BG = ['bg-yellow-500/10 border-yellow-500/30', 'bg-slate-500/10 border-slate-500/30', 'bg-amber-700/10 border-amber-700/30']
const PODIUM_ICONS = [
    <Crown className="w-5 h-5 text-yellow-400" key="gold" />,
    <Trophy className="w-4 h-4 text-slate-400" key="silver" />,
    <Trophy className="w-4 h-4 text-amber-600" key="bronze" />,
]

function PodiumCard({ entry, position }: { entry: LeaderEntry; position: 0 | 1 | 2 }) {
    const heights = ['pb-16', 'pb-10', 'pb-6']
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: position * 0.12, type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ y: -4 }}
            className={`flex flex-col items-center ${position === 0 ? 'order-2' : position === 1 ? 'order-1' : 'order-3'}`}
        >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 flex items-center justify-center text-lg font-bold text-white mb-2 ${RANK_BG[position]} border-current`}>
                {entry.name.charAt(0)}
            </div>
            <p className="text-xs font-semibold text-slate-300 text-center max-w-[80px] truncate">{entry.name.split(' ')[0]}</p>
            <p className="text-xs text-slate-500 mb-2">{entry.xp.toLocaleString()} XP</p>
            <div className={`w-20 rounded-t-2xl flex flex-col items-center justify-start pt-3 border-t border-x ${RANK_BG[position]} ${heights[position]}`}>
                {PODIUM_ICONS[position]}
                <span className={`text-lg font-black mt-1 ${RANK_COLORS[position]}`}>#{entry.rank}</span>
            </div>
        </motion.div>
    )
}

export default function LeaderboardPage() {
    const { user } = useStore()
    const [entries, setEntries] = useState<LeaderEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        getLeaderboard(20)
            .then(res => {
                const data: LeaderEntry[] = (res.data || []).map(e => ({
                    ...e,
                    is_current_user: e.user_id === user?.id,
                }))
                setEntries(data)
            })
            .catch(err => {
                console.error('Leaderboard fetch error:', err)
                // If API fails, show current user as solo entry
                if (user) {
                    setEntries([{
                        rank: 1,
                        user_id: user.id,
                        name: user.email?.split('@')[0] || 'You',
                        institution: 'Mumbai University',
                        xp: 0,
                        streak_days: 0,
                        topics_mastered: 0,
                        is_current_user: true,
                    }])
                }
            })
            .finally(() => setIsLoading(false))
    }, [user])

    if (isLoading) {
        return (
            <div className="w-full min-h-screen pt-24 flex items-center justify-center relative z-10">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        )
    }

    const top3 = entries.slice(0, 3)
    const rest = entries.slice(3)

    return (
        <div className="w-full min-h-screen p-6 max-w-3xl mx-auto relative z-10 pt-24">

            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm font-medium mb-4"
                >
                    <Trophy className="w-4 h-4" /> Leaderboard
                </motion.div>
                <h1 className="text-3xl font-extrabold text-white">Top Ascendants</h1>
                <p className="text-slate-500 text-sm mt-1">Ranked by XP · {entries.length} active learners</p>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    {/* Podium */}
                    {top3.length >= 3 && (
                        <div className="flex items-end justify-center gap-4 mb-8 px-4">
                            {top3.map((e, i) => (
                                <PodiumCard key={e.user_id} entry={e} position={i as 0 | 1 | 2} />
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    {entries.length > 0 ? (
                        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
                            <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-x-4 px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                                <span>#</span><span>User</span><span>Streak</span><span>XP</span>
                            </div>

                            {(top3.length >= 3 ? rest : entries).map((e, i) => (
                                <motion.div
                                    key={e.user_id}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', x: 2 }}
                                    className={`grid grid-cols-[2rem_1fr_auto_auto] gap-x-4 px-5 py-4 items-center border-b border-white/5 last:border-0 transition-all duration-200 ${e.is_current_user
                                        ? 'bg-indigo-500/10 border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.07)]'
                                        : ''
                                        }`}
                                >
                                    <span className="text-slate-500 font-bold text-sm">{e.rank}</span>
                                    <div className="min-w-0">
                                        <p className={`font-semibold text-sm truncate ${e.is_current_user ? 'text-indigo-300' : 'text-slate-200'}`}>
                                            {e.name} {e.is_current_user && <span className="text-xs text-indigo-500">(You)</span>}
                                        </p>
                                        <p className="text-xs text-slate-600 truncate">{e.institution}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
                                        <Flame className="w-3.5 h-3.5" /> {e.streak_days}d
                                    </div>
                                    <span className={`text-sm font-bold ${e.is_current_user ? 'text-indigo-300' : 'text-slate-300'}`}>
                                        {e.xp.toLocaleString()}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center">
                            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-white mb-1">No Activity Yet</h3>
                            <p className="text-slate-500 text-sm">Complete quizzes to earn XP and climb the leaderboard!</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
