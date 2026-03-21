import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AppNavbar from '../components/layout/AppNavbar'
import { mockQuiz } from '../lib/mockQuiz'

export default function QuizPage() {
    const navigate = useNavigate()
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<(string | null)[]>(Array(mockQuiz.length).fill(null))
    const [direction, setDirection] = useState(1)
    const [showScore, setShowScore] = useState(false)

    const question = mockQuiz[currentQ]
    const total = mockQuiz.length

    const selectAnswer = (opt: string) => {
        const updated = [...answers]
        updated[currentQ] = opt
        setAnswers(updated)
    }

    const goNext = () => {
        if (currentQ === total - 1) {
            setShowScore(true)
        } else {
            setDirection(1)
            setCurrentQ((q) => q + 1)
        }
    }

    const goPrev = () => {
        if (currentQ === 0) return
        setDirection(-1)
        setCurrentQ((q) => q - 1)
    }

    const handleDontKnow = () => {
        const updated = [...answers]
        updated[currentQ] = null
        setAnswers(updated)
        goNext()
    }

    const score = answers.filter((a, i) => a === mockQuiz[i].answer).length

    if (showScore) {
        return (
            <div className="min-h-screen relative z-10">
                <AppNavbar />
                <div className="pt-28 px-4 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-panel rounded-3xl p-10 max-w-md w-full text-center"
                    >
                        <div className="text-6xl mb-4">{score >= 7 ? '🎉' : score >= 5 ? '👍' : '💪'}</div>
                        <h2 className="text-3xl font-extrabold text-white mb-2">Quiz Complete!</h2>
                        <p className="text-slate-400 mb-6">You scored</p>
                        <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
                            {score}/{total}
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-8">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{ width: `${(score / total) * 100}%` }}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity"
                        >
                            Back to Home
                        </button>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative z-10 flex flex-col">
            <AppNavbar />

            <div className="pt-20 flex flex-col flex-1">
                {/* Back link */}
                <div className="px-6 pt-4">
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> HOME
                    </button>
                </div>

                {/* Quiz body */}
                <div className="flex-1 flex flex-col px-4 md:px-8 pb-0 max-w-2xl mx-auto w-full pt-4">
                    {/* Topic label */}
                    <p className="text-slate-400 text-xs italic mb-1">Topic : {question.topic}</p>

                    {/* Question number */}
                    <h3 className="text-sm font-bold text-white mb-3">Q.{currentQ + 1}.</h3>

                    {/* Question box */}
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentQ}
                            custom={direction}
                            initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="flex flex-col gap-4"
                        >
                            {/* Question card */}
                            <div className="w-full rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm px-6 py-8 min-h-[120px] flex items-center justify-center">
                                <p className="text-center text-white font-semibold text-base md:text-lg">
                                    {question.question}
                                </p>
                            </div>

                            {/* Answer Options */}
                            <div className="grid grid-cols-2 gap-3">
                                {question.options.map((opt, i) => {
                                    const letter = ['A', 'B', 'C', 'D'][i]
                                    const isSelected = answers[currentQ] === opt
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => selectAnswer(opt)}
                                            className={`py-4 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 border transition-all duration-150 ${isSelected
                                                ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                                                : 'bg-white/10 border-white/15 text-slate-300 hover:bg-white/20 hover:border-white/30'
                                                }`}
                                        >
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                                                {letter}
                                            </span>
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* I don't know */}
                    <div className="text-center mt-4">
                        <button
                            onClick={handleDontKnow}
                            className="text-blue-400 text-sm underline hover:text-blue-300 transition-colors"
                        >
                            I don't know
                        </button>
                    </div>
                </div>

                {/* Bottom navigation bar */}
                <div className="mt-6">
                    {/* Yellow nav bar */}
                    <div className="yellow-bar w-full flex items-center justify-between px-6 py-3">
                        <button
                            onClick={goPrev}
                            disabled={currentQ === 0}
                            className="w-9 h-9 rounded-full bg-green-500 disabled:bg-green-300 flex items-center justify-center shadow transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <span className="text-sm font-bold text-slate-900">{currentQ + 1}/{total}</span>
                        <button
                            onClick={goNext}
                            className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow transition-colors hover:bg-green-600"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Note banner */}
                    <div className="w-full yellow-bar py-2.5 text-center">
                        <p className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            *NOTE : THIS IS A BASIC KNOWLEDGE CHECK QUIZ OF {total} QUESTIONS
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
