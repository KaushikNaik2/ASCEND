import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Globe, Building, Crown } from 'lucide-react'
import type { LeaderboardEntry } from '../types'

const BOARD_DATA: LeaderboardEntry[] = [
    { rank: 1, user_id: 'u1', name: 'Priya Sharma', institution: 'Mumbai University', xp: 5420, streak_days: 34 },
    { rank: 2, user_id: 'u2', name: 'Arjun Mehta', institution: 'Mumbai University', xp: 4980, streak_days: 28 },
    { rank: 3, user_id: 'u3', name: 'Alex You', institution: 'Mumbai University', xp: 4350, streak_days: 12, is_current_user: true },
    { rank: 4, user_id: 'u4', name: 'Siddharth Rao', institution: 'Mumbai University', xp: 3990, streak_days: 21 },
    { rank: 5, user_id: 'u5', name: 'Neha Kulkarni', institution: 'Mumbai University', xp: 3750, streak_days: 15 },
    { rank: 6, user_id: 'u6', name: 'Rohan Das', institution: 'Mumbai University', xp: 3410, streak_days: 9 },
    { rank: 7, user_id: 'u7', name: 'Aisha Patel', institution: 'Mumbai University', xp: 3200, streak_days: 7 },
    { rank: 8, user_id: 'u8', name: 'Karan Singh', institution: 'Mumbai University', xp: 2950, streak_days: 4 },
    { rank: 9, user_id: 'u9', name: 'Divya Nair', institution: 'Mumbai University', xp: 2700, streak_days: 3 },
    { rank: 10, user_id: 'u10', name: 'Vikram Joshi', institution: 'Mumbai University', xp: 2500, streak_days: 2 },
]

const GLOBAL_DATA: LeaderboardEntry[] = [
    { rank: 1, user_id: 'g1', name: 'Chen Wei', institution: 'IIT Delhi', xp: 12400, streak_days: 78 },
    { rank: 2, user_id: 'g2', name: 'Sarah Mitchell', institution: 'MIT', xp: 11800, streak_days: 65 },
    { rank: 3, user_id: 'g3', name: 'Ananya Iyer', institution: 'BITS Pilani', xp: 10600, streak_days: 52 },
    { rank: 4, user_id: 'g4', name: 'Lucas Ferreira', institution: 'USP Brazil', xp: 9800, streak_days: 44 },
    { rank: 5, user_id: 'g5', name: 'Yuki Tanaka', institution: 'Tokyo Tech', xp: 8900, streak_days: 38 },
    { rank: 6, user_id: 'u3', name: 'Alex You', institution: 'Mumbai University', xp: 4350, streak_days: 12, is_current_user: true },
    { rank: 7, user_id: 'g7', name: 'Omar Hassan', institution: 'Cairo Uni', xp: 4100, streak_days: 10 },
    { rank: 8, user_id: 'g8', name: 'Fatima Al-Zahra', institution: 'AUB', xp: 3800, streak_days: 8 },
    { rank: 9, user_id: 'g9', name: 'Lena Müller', institution: 'TU Berlin', xp: 3500, streak_days: 6 },
    { rank: 10, user_id: 'g10', name: 'Raj Patel', institution: 'Pune Uni', xp: 3200, streak_days: 5 },
]

const RANK_COLORS = ['text-yellow-400', 'text-slate-400', 'text-amber-600']
const RANK_BG = ['bg-yellow-500/10 border-yellow-500/30', 'bg-slate-500/10 border-slate-500/30', 'bg-amber-700/10 border-amber-700/30']
const PODIUM_ICONS = [
    <Crown className="w-5 h-5 text-yellow-400" key="gold" />,
    <Trophy className="w-4 h-4 text-slate-400" key="silver" />,
    <Trophy className="w-4 h-4 text-amber-600" key="bronze" />,
]

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: 0 | 1 | 2 }) {
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
    const [scope, setScope] = useState<'board' | 'global'>('board')
    const entries = scope === 'board' ? BOARD_DATA : GLOBAL_DATA
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
                    <Trophy className="w-4 h-4" /> Weekly Leaderboard
                </motion.div>
                <h1 className="text-3xl font-extrabold text-white">Top Ascendants</h1>
                <p className="text-slate-500 text-sm mt-1">Refreshes every 24 hours · Current week</p>
            </div>

            {/* Scope toggle */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
                    {([['board', Building, 'My Board'], ['global', Globe, 'Global']] as const).map(([key, Icon, label]) => (
                        <button
                            key={key}
                            onClick={() => setScope(key)}
                            className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${scope === key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {scope === key && (
                                <motion.div
                                    layoutId="scope-pill"
                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20"
                                />
                            )}
                            <Icon className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={scope}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                >
                    {/* Podium */}
                    <div className="flex items-end justify-center gap-4 mb-8 px-4">
                        {top3.map((e, i) => (
                            <PodiumCard key={e.user_id} entry={e} position={i as 0 | 1 | 2} />
                        ))}
                    </div>

                    {/* Table */}
                    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-x-4 px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                            <span>#</span><span>User</span><span>Streak</span><span>XP</span>
                        </div>

                        {rest.map((e, i) => (
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
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
