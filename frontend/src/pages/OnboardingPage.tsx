import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    BookOpen, Cpu, ArrowRight,
    CheckCircle, Brain
} from 'lucide-react'
import type { Track } from '../types'
import { useState } from 'react'

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)

    const handleAcademicSelect = () => {
        setSelectedTrack(selectedTrack === 'academic' ? null : 'academic')
    }

    const handleForgeSelect = () => {
        alert('Skill Mode and Pathfinder algorithms are scheduled for Phase 2 deployment.')
    }

    const handleContinue = () => {
        if (selectedTrack === 'academic') {
            navigate('/generate')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
            <motion.div
                initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-3xl"
            >
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6"
                    >
                        <Brain className="w-4 h-4" />
                        Welcome to ASCEND — Choose Your Track
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                        How do you want to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            be tested?
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg">Select your learning mode to get started.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Academic */}
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleAcademicSelect}
                        className={`relative p-8 rounded-3xl border text-left transition-all overflow-hidden group cursor-pointer ${selectedTrack === 'academic'
                            ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        {selectedTrack === 'academic' && (
                            <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-blue-400" />
                        )}
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-5 relative z-10">
                            <BookOpen className="w-7 h-7 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Academic</h2>
                        <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                            Syllabus-mapped, board-anchored, exam-weighted. Upload your PDF and get tested on your exact curriculum.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 relative z-10">
                            {['CBSE', 'Mumbai Uni', 'Pune Uni'].map(b => (
                                <span key={b} className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs border border-white/10">{b}</span>
                            ))}
                        </div>
                    </motion.button>

                    {/* FORGE — Disabled for Phase 2 */}
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleForgeSelect}
                        className="relative p-8 rounded-3xl border text-left transition-all overflow-hidden group cursor-pointer border-white/10 bg-white/5 hover:border-white/20 opacity-60"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                            Coming Soon
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5 relative z-10">
                            <Cpu className="w-7 h-7 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">FORGE</h2>
                        <p className="text-slate-400 text-sm leading-relaxed relative z-10">
                            Domain-selected, industry-anchored, skill-weighted. Test yourself on real-world engineering domains.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2 relative z-10">
                            {['DSA', 'Web Dev', 'AI/ML', 'DevOps'].map(d => (
                                <span key={d} className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs border border-white/10">{d}</span>
                            ))}
                        </div>
                    </motion.button>
                </div>

                <div className="flex justify-end mt-8">
                    <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        disabled={selectedTrack !== 'academic'}
                        onClick={handleContinue}
                        className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-base flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all cursor-pointer"
                    >
                        Continue <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    )
}
