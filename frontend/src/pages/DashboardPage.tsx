import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, BookOpen, Flame, Map, ArrowRight, Play, Check, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { UserProfileResponse, UserRoadmap } from '../lib/api'
import { getUserProfile, getUserRoadmaps } from '../lib/api'

function CircularProgress({ progress }: { progress: number }) {
  // Fix NaN if progress is somehow undefined
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r="20" className="stroke-white/10" strokeWidth="4" fill="none" />
        <motion.circle
          cx="24" cy="24" r="20"
          className="stroke-indigo-500"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{Math.round(safeProgress)}%</span>
    </div>
  )
}

function StreakCalendar({ streakDays }: { streakDays: number }) {
  const weeks = Array.from({ length: 7 });
  const days = Array.from({ length: 7 });

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Flame className={`w-5 h-5 ${streakDays > 0 ? 'text-orange-500' : 'text-slate-500'}`} />
        Study Streak
      </h3>
      <div className="flex gap-2">
        {weeks.map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            {days.map((_, j) => {
              // Pseudo-random streak visualization based on streak length
              const threshold = 1 - (streakDays / 30);
              const activity = Math.random();
              let bgClass = "bg-white/5";
              if (streakDays > 0) {
                if (activity > Math.max(0.2, threshold)) bgClass = "bg-indigo-500";
                else if (activity > Math.max(0.1, threshold - 0.2)) bgClass = "bg-indigo-500/60";
                else if (activity > Math.max(0.05, threshold - 0.4)) bgClass = "bg-indigo-500/30";
              }

              return (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (i * 7 + j) * 0.01 }}
                  key={j}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] ${bgClass}`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function calculateProgress(roadmap: UserRoadmap): number {
  const state = roadmap.progress_state || {};
  const total = Object.keys(state).length || 1; // avoid division by zero
  const done = Object.values(state).filter(status => status === 'done').length;
  return Math.round((done / total) * 100);
}

export default function DashboardPage() {
  const { user } = useStore()
  const [profile, setProfile] = useState<UserProfileResponse['data'] | null>(null)
  const [roadmaps, setRoadmaps] = useState<UserRoadmap[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        const [profileRes, mapsRes] = await Promise.all([
          getUserProfile(user.id),
          getUserRoadmaps(user.id)
        ])
        setProfile(profileRes.data)
        setRoadmaps(mapsRes.data || [])
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [user])

  if (isLoading) {
    return (
      <div className="w-full min-h-[85vh] flex items-center justify-center relative z-10">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    )
  }

  // Derive top active roadmaps
  const activeRoadmaps = roadmaps
    .map(rm => ({ ...rm, progress: calculateProgress(rm) }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const topRoadmap = activeRoadmaps[0];
  const firstName = profile?.full_name?.split(' ')[0] || 'Explorer'

  return (
    <div className="w-full min-h-[85vh] p-6 max-w-7xl mx-auto relative z-10 flex flex-col mt-4">
      {/* Hero / Quick Stats */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Welcome back, {firstName}! 👋</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Topics Mastered", value: profile?.topics_mastered || 0, icon: <Check className="w-5 h-5 text-emerald-400" /> },
            { label: "Study Hours", value: `${profile?.study_hours || 0}h`, icon: <Clock className="w-5 h-5 text-blue-400" /> },
            { label: "Current Streak", value: `${profile?.streak_days || 0} Days`, icon: <Flame className="w-5 h-5 text-orange-400" /> },
            { label: "Roadmaps", value: `${profile?.active_roadmaps || 0} Active`, icon: <Map className="w-5 h-5 text-purple-400" /> }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col gap-2 relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
              <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-2 relative z-10">
                {stat.icon}
              </div>
              <span className="text-2xl font-bold text-white relative z-10">{stat.value}</span>
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold relative z-10">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left Column: Continue Learning & Roadmaps */}
        <div className="lg:col-span-2 space-y-8">

          {/* Spotlight Card */}
          <section>
            <h2 className="text-xl font-bold mb-4 w-full border-b border-white/5 pb-2">Continue Learning</h2>
            {topRoadmap ? (
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors" />
                <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
                      {(topRoadmap.customized_syllabus as any)[0]?.title || 'Syllabus'}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-2">Continue from where you left off</h3>
                    <p className="text-slate-400 text-sm mb-4">Jump back into your active roadmap modules.</p>
                  </div>
                  <Link
                    to={`/roadmap/${topRoadmap.id}`}
                    className="shrink-0 w-16 h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
                  >
                    <Play className="w-6 h-6 ml-1" fill="currentColor" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border border-white/5 text-center py-10">
                <p className="text-slate-400 mb-4">No active roadmaps found.</p>
                <Link to="/upload" className="px-5 py-2 rounded-xl bg-indigo-500 text-white font-semibold">Upload a Syllabus to Start</Link>
              </div>
            )}
          </section>

          {/* In Progress Roadmaps */}
          {activeRoadmaps.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <h2 className="text-xl font-bold">In Progress</h2>
                <Link to="/roadmaps" className="text-indigo-400 text-sm hover:underline">View All</Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {activeRoadmaps.slice(0, 4).map((rm, i) => (
                  <Link to={`/roadmap/${rm.id}`} key={rm.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all flex items-center gap-4 group">
                    <CircularProgress progress={rm.progress} />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">{(rm.customized_syllabus as any)[0]?.title || 'Study Plan'}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(rm.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Calendar & Recommended */}
        <div className="space-y-8">
          <StreakCalendar streakDays={profile?.streak_days || 0} />

          {/* Recommended */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">Top Clusters</h3>
            <div className="space-y-4">
              {((topRoadmap?.customized_syllabus as any[]) || []).map((subject: any, i: number) => (
                <Link to={`/roadmap/${topRoadmap.id}`} key={i} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm group-hover:text-indigo-300 transition-colors line-clamp-1">{subject.title}</span>
                    <span className="text-xs text-slate-500 mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> {subject.modules?.length || 0} Modules</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              )).slice(0, 4)}
              {!((topRoadmap?.customized_syllabus as any[])?.length > 0) && (
                <p className="text-sm text-slate-500">Explore modules to see recommendations.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
