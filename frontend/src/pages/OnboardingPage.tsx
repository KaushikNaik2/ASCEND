import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    BookOpen, Cpu, ArrowRight, ArrowLeft, Upload,
    CheckCircle, ChevronDown, Brain, Zap, SkipForward
} from 'lucide-react'
import type { Track, DifficultyLevel } from '../types'

type Step = 1 | 2 | 3

const FORGE_DOMAINS = [
    { id: 'dsa', label: 'DSA', icon: '🧩', color: 'from-blue-500 to-cyan-500' },
    { id: 'web_dev', label: 'Web Dev', icon: '🌐', color: 'from-emerald-500 to-teal-500' },
    { id: 'ai_ml', label: 'AI / ML', icon: '🤖', color: 'from-purple-500 to-pink-500' },
    { id: 'system_design', label: 'System Design', icon: '🏗️', color: 'from-orange-500 to-amber-500' },
    { id: 'devops', label: 'DevOps', icon: '⚙️', color: 'from-rose-500 to-red-500' },
    { id: 'database', label: 'Database Engineering', icon: '🗄️', color: 'from-indigo-500 to-blue-500' },
]

const BOARDS = ['CBSE', 'Mumbai University', 'Pune University', 'Other']
const LEVELS: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced']

const DIAGNOSTIC_QUESTIONS = [
    { q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 1 },
    { q: 'Which data structure uses LIFO order?', opts: ['Queue', 'Heap', 'Stack', 'Tree'], correct: 2 },
    { q: 'What does HTTP stand for?', opts: ['HyperText Transfer Protocol', 'High Transfer Text Protocol', 'Hyper Transfer Text Protocol', 'HyperText Transmission Protocol'], correct: 0 },
]

export default function OnboardingPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>(1)
    const [selectedTracks, setSelectedTracks] = useState<Track[]>([])
    const [selectedBoard, setSelectedBoard] = useState('')
    const [selectedDomain, setSelectedDomain] = useState('')
    const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>('Beginner')
    const [dragOver, setDragOver] = useState(false)
    const [fileName, setFileName] = useState('')
    const [diagAnswers, setDiagAnswers] = useState<(number | null)[]>(Array(DIAGNOSTIC_QUESTIONS.length).fill(null))
    const [diagDone, setDiagDone] = useState(false)

    const toggleTrack = (t: Track) =>
        setSelectedTracks(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

    const canProceedStep1 = selectedTracks.length > 0
    const canProceedStep2 = selectedTracks.includes('academic')
        ? selectedBoard !== '' && fileName !== ''
        : selectedDomain !== ''

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f?.type === 'application/pdf') setFileName(f.name)
    }

    const handleComplete = () => navigate('/graph')
    const handleSkipDiag = () => navigate('/graph')

    const allDiagAnswered = diagAnswers.every(a => a !== null)

    const score = diagAnswers.reduce<number>((acc, ans, i) =>
        ans === DIAGNOSTIC_QUESTIONS[i].correct ? acc + 1 : acc, 0)

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
            {/* Progress dots */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {([1, 2, 3] as Step[]).map(s => (
                    <motion.div
                        key={s}
                        animate={{ scale: step === s ? 1.3 : 1, opacity: step >= s ? 1 : 0.3 }}
                        className={`w-2 h-2 rounded-full ${step >= s ? 'bg-indigo-400' : 'bg-slate-600'}`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ─── STEP 1: Track Selection ─── */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-3xl"
                    >
                        <div className="text-center mb-12">
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6"
                            >
                                <Brain className="w-4 h-4" />
                                Step 1 of 3 — Choose Your Track
                            </motion.div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                                How do you want to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                    be tested?
                                </span>
                            </h1>
                            <p className="text-slate-400 text-lg">You can activate both tracks. They run in parallel and share XP.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Academic */}
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => toggleTrack('academic')}
                                className={`relative p-8 rounded-3xl border text-left transition-all overflow-hidden group ${selectedTracks.includes('academic')
                                    ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                {selectedTracks.includes('academic') && (
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

                            {/* FORGE */}
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => toggleTrack('forge')}
                                className={`relative p-8 rounded-3xl border text-left transition-all overflow-hidden group ${selectedTracks.includes('forge')
                                    ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                {selectedTracks.includes('forge') && (
                                    <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-purple-400" />
                                )}
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
                                disabled={!canProceedStep1}
                                onClick={() => setStep(2)}
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-base flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
                            >
                                Continue <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ─── STEP 2: Setup ─── */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-3xl"
                    >
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
                                <Zap className="w-4 h-4" />
                                Step 2 of 3 — Configure Your Setup
                            </div>
                            <h1 className="text-4xl font-extrabold text-white mb-3">Set up your tracks</h1>
                            <p className="text-slate-400">Provide details so we can map you to the right concept graph.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Academic Setup */}
                            {selectedTracks.includes('academic') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 space-y-5"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                        <h3 className="text-lg font-bold text-white">Academic Track</h3>
                                    </div>

                                    {/* Board selector */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Board / University</label>
                                        <div className="relative">
                                            <select
                                                value={selectedBoard}
                                                onChange={e => setSelectedBoard(e.target.value)}
                                                className="w-full appearance-none bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white pr-10 focus:outline-none focus:border-blue-500/50 transition-colors"
                                            >
                                                <option value="">Select board...</option>
                                                {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* PDF Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Syllabus PDF</label>
                                        <div
                                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleDrop}
                                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragOver ? 'border-blue-500 bg-blue-500/10' : fileName ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-white/3 hover:border-white/20'
                                                }`}
                                        >
                                            {fileName ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                                    <span className="text-green-300 font-medium">{fileName}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                                                    <p className="text-slate-400 text-sm">Drag & drop your PDF here, or{' '}
                                                        <label className="text-blue-400 cursor-pointer hover:underline">
                                                            browse
                                                            <input
                                                                type="file"
                                                                accept=".pdf"
                                                                className="sr-only"
                                                                onChange={e => { const f = e.target.files?.[0]; if (f) setFileName(f.name) }}
                                                            />
                                                        </label>
                                                    </p>
                                                    <p className="text-slate-600 text-xs mt-1">PDF only · Max 10MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* FORGE Setup */}
                            {selectedTracks.includes('forge') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                    className="p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 space-y-5"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <Cpu className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-bold text-white">FORGE Track</h3>
                                    </div>

                                    {/* Domain grid */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">Domain</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {FORGE_DOMAINS.map(d => (
                                                <motion.button
                                                    key={d.id}
                                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    onClick={() => setSelectedDomain(d.id)}
                                                    className={`relative p-4 rounded-2xl border text-left transition-all overflow-hidden ${selectedDomain === d.id
                                                        ? 'border-purple-500/60 bg-purple-500/15'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                        }`}
                                                >
                                                    {selectedDomain === d.id && (
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${d.color} opacity-10`} />
                                                    )}
                                                    <span className="text-2xl block mb-1">{d.icon}</span>
                                                    <span className="text-sm font-semibold text-white relative z-10">{d.label}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-3">Level</label>
                                        <div className="flex gap-3">
                                            {LEVELS.map(lv => (
                                                <button
                                                    key={lv}
                                                    onClick={() => setSelectedLevel(lv)}
                                                    className={`flex-1 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${selectedLevel === lv
                                                        ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                                                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {lv}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 rounded-full border border-white/10 text-slate-400 font-medium flex items-center gap-2 hover:border-white/20 hover:text-white transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                disabled={!canProceedStep2}
                                onClick={() => setStep(3)}
                                className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
                            >
                                Continue <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* ─── STEP 3: Diagnostic Quiz ─── */}
                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-2xl"
                    >
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-medium mb-6">
                                <Brain className="w-4 h-4" />
                                Step 3 of 3 — Diagnostic Quiz (Optional)
                            </div>
                            <h1 className="text-3xl font-extrabold text-white mb-3">
                                Let's see where you stand.
                            </h1>
                            <p className="text-slate-400">
                                3 quick questions to initialize your knowledge vector. You can skip — vector defaults to neutral.
                            </p>
                        </div>

                        {!diagDone ? (
                            <div className="space-y-4">
                                {DIAGNOSTIC_QUESTIONS.map((q, qi) => (
                                    <motion.div
                                        key={qi}
                                        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.1 }}
                                        className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
                                    >
                                        <p className="text-white font-semibold mb-4 leading-relaxed">{qi + 1}. {q.q}</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {q.opts.map((opt, oi) => (
                                                <button
                                                    key={oi}
                                                    onClick={() => setDiagAnswers(prev => { const next = [...prev]; next[qi] = oi; return next })}
                                                    className={`px-4 py-3 rounded-xl border text-sm text-left font-medium transition-all ${diagAnswers[qi] === oi
                                                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                                                        : 'border-white/10 bg-white/3 text-slate-400 hover:border-white/20 hover:text-white'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        onClick={handleSkipDiag}
                                        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                                    >
                                        <SkipForward className="w-4 h-4" /> Skip — start at neutral
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                        disabled={!allDiagAnswered}
                                        onClick={() => setDiagDone(true)}
                                        className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all"
                                    >
                                        Submit <ArrowRight className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        ) : (
                            // Results summary
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                                    <span className="text-3xl font-extrabold text-white">{score}/{DIAGNOSTIC_QUESTIONS.length}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Vector Initialized!</h2>
                                <p className="text-slate-400 mb-8">
                                    Your knowledge vector is now tuned to your baseline.{' '}
                                    {score === DIAGNOSTIC_QUESTIONS.length
                                        ? "Excellent baseline — you'll start at higher difficulty."
                                        : 'ASCEND will focus on your gaps first.'}
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    onClick={handleComplete}
                                    className="px-10 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg flex items-center gap-2 mx-auto shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                                >
                                    Enter ASCEND <ArrowRight className="w-5 h-5" />
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
