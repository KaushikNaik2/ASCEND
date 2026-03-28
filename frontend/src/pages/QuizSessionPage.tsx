import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, ChevronRight, Check, X, CircleAlert } from 'lucide-react'
import type { QuizQuestion } from '../types'

const MOCK_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1', cluster_id: 'c3', text: 'What is the base case condition needed to prevent infinite recursion?',
        options: ['A condition that always evaluates to true', 'A condition where the function stops calling itself', 'The first line of any function', 'A loop that runs once'],
        correct_index: 1, explanation: 'The base case is the condition under which a recursive function returns a value directly without making further recursive calls, preventing infinite loops.', difficulty: 2.0, bloom_level: 'Remember',
    },
    {
        id: 'q2', cluster_id: 'c3', text: 'In the N-Queens problem using backtracking, what triggers a backtrack?',
        options: ['Finding a valid queen placement', 'All rows are filled with queens', 'A queen placement conflicts with an existing queen', 'The board is empty'],
        correct_index: 2, explanation: 'Backtracking is triggered when a newly placed queen attacks any previously placed queen (same row, column, or diagonal). We then undo that placement and try the next position.', difficulty: 3.5, bloom_level: 'Apply',
    },
    {
        id: 'q3', cluster_id: 'c3', text: 'Which of the following is NOT a characteristic of recursive algorithms?',
        options: ['They call themselves directly or indirectly', 'They require a base case', 'They always use less memory than iterative solutions', 'They can solve problems by dividing them into sub-problems'],
        correct_index: 2, explanation: 'Recursive algorithms typically use MORE memory than iterative ones due to the function call stack overhead. Each recursive call adds a new stack frame.', difficulty: 2.5, bloom_level: 'Understand',
    },
    {
        id: 'q4', cluster_id: 'c3', text: 'What is memoization in the context of recursive algorithms?',
        options: ['A technique to minimize recursion depth', 'Storing results of expensive function calls to avoid recomputation', 'Reordering recursive calls for efficiency', 'Replacing recursion with iteration'],
        correct_index: 1, explanation: 'Memoization caches the results of function calls so that when the same inputs occur again, the cached result is returned instead of recomputing, improving time complexity from exponential to polynomial in many cases.', difficulty: 3.0, bloom_level: 'Understand',
    },
    {
        id: 'q5', cluster_id: 'c3', text: 'What is the time complexity of the naive recursive Fibonacci implementation?',
        options: ['O(n)', 'O(n log n)', 'O(2ⁿ)', 'O(n²)'],
        correct_index: 2, explanation: 'The naive recursive Fibonacci computes F(n-1) and F(n-2) at each step, creating an exponential tree of calls. This leads to O(2ⁿ) time complexity because each call branches into two sub-calls.', difficulty: 2.5, bloom_level: 'Analyze',
    },
]

const TOTAL_TIME = 45 // seconds per question

export default function QuizSessionPage() {
    const { clusterId: _clusterId } = useParams()
    const navigate = useNavigate()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(MOCK_QUESTIONS.length).fill(null))
    const [showFeedback, setShowFeedback] = useState(false)
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
    const [timerActive, setTimerActive] = useState(true)
    const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

    const question = MOCK_QUESTIONS[currentIndex]
    const isLast = currentIndex === MOCK_QUESTIONS.length - 1

    // Timer
    useEffect(() => {
        if (!timerActive || showFeedback) return
        setTimeLeft(TOTAL_TIME)
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current)
                    handleAnswer(-1) // auto-submit as wrong
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [currentIndex, timerActive, showFeedback])

    const handleAnswer = (optIdx: number) => {
        if (showFeedback) return
        clearInterval(timerRef.current)
        setSelectedOption(optIdx)
        const newAnswers = [...answers]
        newAnswers[currentIndex] = optIdx
        setAnswers(newAnswers)
        setShowFeedback(true)
    }

    const handleNext = () => {
        if (isLast) {
            navigate('/quiz/session-1/results', { state: { answers, questions: MOCK_QUESTIONS } })
            return
        }
        setCurrentIndex(i => i + 1)
        setSelectedOption(null)
        setShowFeedback(false)
        setTimeLeft(TOTAL_TIME)
    }

    const isCorrect = selectedOption === question.correct_index
    const timeProgress = (timeLeft / TOTAL_TIME) * 100

    const optionStyle = (idx: number) => {
        if (!showFeedback) {
            return selectedOption === idx
                ? 'border-indigo-500 bg-indigo-500/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
        }
        if (idx === question.correct_index) return 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
        if (idx === selectedOption && !isCorrect) return 'border-red-500 bg-red-500/15 text-red-300'
        return 'border-white/5 bg-white/3 text-slate-600'
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
            <div className="w-full max-w-2xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Recursion &amp; Backtracking</p>
                        <p className="text-sm text-slate-400 mt-0.5">Question {currentIndex + 1} of {MOCK_QUESTIONS.length}</p>
                    </div>
                    <button
                        onClick={() => setTimerActive(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 text-xs hover:text-white transition-colors"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        {timerActive ? `${timeLeft}s` : 'Paused'}
                    </button>
                </div>

                {/* ── Progress bar ── */}
                <div className="mb-2">
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-1">
                        <motion.div
                            animate={{ width: `${((currentIndex + 1) / MOCK_QUESTIONS.length) * 100}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                    </div>
                    {/* Timer bar */}
                    {timerActive && !showFeedback && (
                        <div className="w-full h-0.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                                animate={{ width: `${timeProgress}%` }}
                                transition={{ duration: 0.5 }}
                                className={`h-full rounded-full transition-colors ${timeLeft > 20 ? 'bg-blue-500' : timeLeft > 10 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                            />
                        </div>
                    )}
                </div>

                {/* ── Bloom badge ── */}
                <div className="flex items-center gap-2 mb-4 mt-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                        {question.bloom_level}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                        Difficulty {question.difficulty.toFixed(1)}
                    </span>
                </div>

                {/* ── Question card ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 mb-5"
                    >
                        <p className="text-white text-lg md:text-xl font-semibold leading-relaxed">{question.text}</p>
                    </motion.div>
                </AnimatePresence>

                {/* ── Options ── */}
                <AnimatePresence mode="wait">
                    <motion.div key={question.id + '-opts'} className="space-y-3">
                        {question.options.map((opt, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                disabled={showFeedback}
                                onClick={() => handleAnswer(i)}
                                className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all flex items-center gap-3 ${optionStyle(i)}`}
                            >
                                <span className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold border-current">
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {showFeedback && i === question.correct_index && (
                                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                )}
                                {showFeedback && i === selectedOption && !isCorrect && i !== question.correct_index && (
                                    <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* ── Feedback banner ── */}
                <AnimatePresence>
                    {showFeedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`mt-5 p-4 rounded-2xl border flex items-start gap-3 ${isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                                }`}
                        >
                            {isCorrect
                                ? <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                : <CircleAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            }
                            <div>
                                <p className={`text-sm font-bold mb-1 ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {isCorrect ? 'Correct!' : 'Not quite.'}
                                </p>
                                <p className="text-slate-400 text-sm leading-relaxed">{question.explanation}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Next button ── */}
                {showFeedback && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end mt-5">
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={handleNext}
                            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold flex items-center gap-2 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all"
                        >
                            {isLast ? 'View Results' : 'Next'} <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
