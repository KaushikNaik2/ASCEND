import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, GraduationCap, Zap, Bell } from 'lucide-react'
import AppNavbar from '../components/layout/AppNavbar'
import { useStore } from '../store/useStore'
import { mockAcademicsSubjects, mockSkillsTopics } from '../lib/mockSubjects'

export default function HomePage() {
    const { mode, setMode, signupData } = useStore()
    const navigate = useNavigate()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [fadeKey, setFadeKey] = useState(0)

    const isAcademics = mode !== 'skills'
    const subjects = isAcademics ? mockAcademicsSubjects : mockSkillsTopics
    const displayName = signupData.name || 'LEARNER'

    const toggleMode = () => {
        setMode(isAcademics ? 'skills' : 'academics')
        setFadeKey((k) => k + 1)
    }

    const scroll = (dir: 'left' | 'right') => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen relative z-10">
            <AppNavbar />

            {/* Page Content */}
            <div className="pt-20 px-4 md:px-8 pb-10 max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={fadeKey}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
                    >
                        {/* Inner body panel — light feel */}
                        <div className="bg-slate-100/10 rounded-3xl p-6 md:p-8 relative">

                            {/* Mode Toggle Pill — top right */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-wide uppercase">
                                        HELLO {displayName.toUpperCase()}!!
                                    </h1>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {isAcademics ? 'Your academic roadmap awaits.' : 'Skill up and level ahead.'}
                                    </p>
                                </div>

                                <button
                                    onClick={toggleMode}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-900 font-semibold text-xs shadow-md hover:shadow-lg transition-all border border-slate-200 shrink-0 ml-4"
                                >
                                    {isAcademics
                                        ? <><GraduationCap className="w-3.5 h-3.5" /> ACADEMICS MODE 🎓</>
                                        : <><Zap className="w-3.5 h-3.5 text-pink-500" /> SKILLS MODE 🚀</>}
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 mb-6" />

                            {/* Analytics Section */}
                            <div className="mb-8">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                                    VIEW ANALYTICS
                                </p>
                                <div className="flex items-center gap-3">
                                    {/* Scroll left */}
                                    <button
                                        onClick={() => scroll('left')}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-white" />
                                    </button>

                                    {/* Subject cards scroll track */}
                                    <div
                                        ref={scrollRef}
                                        className="flex gap-3 overflow-x-auto scrollbar-hide flex-1"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {subjects.map((subject, i) => (
                                            <motion.div
                                                key={`${subject}-${i}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                className="shrink-0 w-24 h-20 rounded-xl border border-white/15 bg-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/20 hover:border-white/30 transition-all shadow-sm"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${isAcademics ? 'bg-blue-400' : 'bg-pink-400'}`} />
                                                <span className="text-white text-[10px] font-semibold text-center leading-tight px-2">
                                                    {subject.toUpperCase()}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Scroll right */}
                                    <button
                                        onClick={() => scroll('right')}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-white/10 mb-6" />

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate('/roadmap')}
                                    className="w-full py-4 rounded-full border-2 border-pink-500/60 text-pink-400 font-bold text-sm uppercase tracking-widest hover:bg-pink-500/10 transition-all"
                                >
                                    VIEW ROADMAP
                                </button>

                                {isAcademics ? (
                                    <button
                                        onClick={() => navigate('/quiz')}
                                        className="w-full py-4 rounded-full border-2 border-pink-400/40 text-pink-300 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-pink-500/10 transition-all"
                                    >
                                        TAKE A QUIZ <Bell className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate('/quiz')}
                                        className="w-full py-4 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        TAKE A QUIZ
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
