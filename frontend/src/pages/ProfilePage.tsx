import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, BookOpen, Calendar, Loader2, LogOut, Trophy, Clock, Map as MapIcon, TrendingUp, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { UserProfileResponse } from '../lib/api'
import { getUserProfile, getUserRoadmaps } from '../lib/api'
import type { UserRoadmap } from '../lib/api'

function StreakCalendar({ streakDays, activityDates }: { streakDays: number; activityDates: Record<string, number> }) {
    // Build a 15-week (105 days) grid ending today
    const today = new Date()
    // Find the start: go back 14 weeks + remaining days to reach a Sunday
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 104) // 105 days total (index 0-104)
    // Align to start of week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const weeks: string[][] = []
    const current = new Date(startDate)
    while (current <= today || weeks.length < 15) {
        const week: string[] = []
        for (let d = 0; d < 7; d++) {
            week.push(current.toISOString().split('T')[0])
            current.setDate(current.getDate() + 1)
        }
        weeks.push(week)
        if (weeks.length >= 15) break
    }

    const maxCount = Math.max(1, ...Object.values(activityDates))

    return (
        <div className="glass-panel p-5 rounded-3xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Activity Calendar
                </h3>
                <div className={`flex items-center gap-1.5 ${streakDays > 0 ? 'text-orange-400' : 'text-slate-400'} font-bold text-sm`}>
                    <Flame className="w-4 h-4" /> {streakDays} day streak
                </div>
            </div>
            <div className="flex gap-1.5">
                {weeks.map((week, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                        {week.map((dateStr, j) => {
                            const count = activityDates[dateStr] || 0
                            const isFuture = new Date(dateStr) > today
                            let bg = 'bg-white/5'
                            if (isFuture) {
                                bg = 'bg-transparent'
                            } else if (count > 0) {
                                const intensity = count / maxCount
                                bg = intensity > 0.7 ? 'bg-indigo-500' : intensity > 0.4 ? 'bg-indigo-500/60' : 'bg-indigo-500/25'
                            }
                            return (
                                <motion.div
                                    key={j}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: (i * 7 + j) * 0.003 }}
                                    className={`w-3 h-3 rounded-[2px] ${bg}`}
                                    title={isFuture ? '' : `${dateStr}: ${count} activities`}
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
    const { user, logout } = useStore()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null)
    const [roadmaps, setRoadmaps] = useState<UserRoadmap[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        Promise.all([
            getUserProfile(user.id),
            getUserRoadmaps(user.id),
        ])
            .then(([profileRes, roadmapsRes]) => {
                setProfile(profileRes.data)
                setRoadmaps(roadmapsRes.data || [])
            })
            .catch(err => console.error("Profile Fetch Error:", err))
            .finally(() => setIsLoading(false))
    }, [user])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (isLoading) {
        return (
            <div className="w-full min-h-screen pt-24 flex items-center justify-center relative z-10">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        )
    }

    const xp = profile?.xp || 0
    const streakDays = profile?.streak_days || 0
    const topicsMastered = profile?.topics_mastered || 0
    const studyHours = profile?.study_hours || 0
    const activeRoadmaps = profile?.active_roadmaps || roadmaps.length
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Explorer'
    const initials = displayName.substring(0, 2).toUpperCase()
    const university = profile?.university || 'University'
    const joinDate = profile?.joined_date
        ? new Date(profile.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Recently'

    // XP level calculation
    const level = Math.floor(xp / 500) + 1
    const xpInLevel = xp % 500
    const xpProgress = (xpInLevel / 500) * 100

    return (
        <div className="w-full min-h-screen p-6 max-w-4xl mx-auto relative z-10 pt-24 pb-20">

            {/* ── Profile Hero ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 mb-6 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-extrabold text-white flex-shrink-0 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        {initials}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-extrabold text-white">{displayName}</h1>
                        <p className="text-slate-400 text-sm mt-0.5">{university} · Joined {joinDate}</p>
                        {user?.email && (
                            <p className="text-slate-500 text-xs mt-1">{user.email}</p>
                        )}
                    </div>

                    {/* XP Level */}
                    <div className="md:w-48 flex-shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
                                <Zap className="w-4 h-4" /> Level {level}
                            </span>
                            <span className="text-xs text-slate-500">{xp} XP</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 text-right">{xpInLevel} / 500 to next level</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Topics Mastered', value: topicsMastered, icon: <Trophy className="w-5 h-5 text-emerald-400" /> },
                    { label: 'Study Hours', value: `${studyHours}h`, icon: <Clock className="w-5 h-5 text-blue-400" /> },
                    { label: 'Current Streak', value: `${streakDays}d`, icon: <Flame className="w-5 h-5 text-orange-400" /> },
                    { label: 'Active Roadmaps', value: activeRoadmaps, icon: <MapIcon className="w-5 h-5 text-purple-400" /> },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col gap-1"
                    >
                        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center mb-1">{stat.icon}</div>
                        <span className="text-xl font-bold text-white">{stat.value}</span>
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">{stat.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* ── Activity Calendar ── */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <StreakCalendar streakDays={streakDays} activityDates={(profile as any)?.activity_dates || {}} />
                </motion.div>

                {/* ── Recent Roadmaps ── */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-panel p-5 rounded-3xl border border-white/10"
                >
                    <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" /> Your Roadmaps
                    </h3>
                    {roadmaps.length > 0 ? (
                        <div className="space-y-2">
                            {roadmaps.slice(0, 5).map((rm) => {
                                const syllabus = rm.customized_syllabus as any
                                const name = syllabus?.subject_name
                                    || (Array.isArray(syllabus) && syllabus[0]?.title)
                                    || 'Study Plan'
                                const moduleCount = syllabus?.modules?.length
                                    || (Array.isArray(syllabus) && syllabus.length)
                                    || 0

                                return (
                                    <div
                                        key={rm.id}
                                        onClick={() => navigate(`/roadmap/${rm.id}`)}
                                        className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group"
                                    >
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{moduleCount} modules · {new Date(rm.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <TrendingUp className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No roadmaps yet. Upload a syllabus to get started.</p>
                    )}
                </motion.div>
            </div>

            {/* ── Logout ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex justify-center"
            >
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all cursor-pointer font-medium text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </motion.div>
        </div>
    )
}
