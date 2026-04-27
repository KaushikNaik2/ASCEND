import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, ChevronRight, Check, X, CircleAlert, Sparkles, Loader2 } from 'lucide-react'
import type { QuizQuestion } from '../types'
import { useStore } from '../store/useStore'
import { getAdaptiveQuiz, submitQuizAnswer } from '../lib/api'
import MathText from '../components/ui/MathText'

const TOTAL_TIME = 45 // seconds per question

export default function QuizSessionPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useStore()

    const topic = searchParams.get('topic') || ''
    const planId = searchParams.get('plan_id') || ''
    const subjectId = searchParams.get('subject_id') || ''

    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [source, setSource] = useState<string>('vector_db')

    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [showFeedback, setShowFeedback] = useState(false)
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
    const [timerActive, setTimerActive] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

    // Debug: log what params we received
    console.log('[QuizSession] Params:', { userId: user?.id, topic, planId })

    useEffect(() => {
        async function loadQuiz() {
            if (!user?.id || !topic || !planId) {
                console.warn('[QuizSession] Missing params, skipping API call')
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            const loaderTimeout = setTimeout(() => setIsGenerating(true), 1500)

            try {
                const response = await getAdaptiveQuiz(user.id, planId, topic, subjectId)
                setQuestions(response.questions)
                setSource(response.source)
                setAnswers(Array(response.questions.length).fill(null))
                setTimerActive(true)
            } catch (err) {
                console.error("Failed to load adaptive quiz", err)
            } finally {
                clearTimeout(loaderTimeout)
                setIsLoading(false)
                setIsGenerating(false)
            }
        }
        loadQuiz()
    }, [user?.id, topic, planId])

    const question = questions[currentIndex]
    const isLast = currentIndex === questions.length - 1

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

    const handleAnswer = async (optIdx: number) => {
        if (showFeedback) return
        clearInterval(timerRef.current)
        setSelectedOption(optIdx)
        const newAnswers = [...answers]
        newAnswers[currentIndex] = optIdx
        setAnswers(newAnswers)
        setShowFeedback(true)

        // Submit proficiency adjustment to backend mathematically!
        try {
            if (user?.id && planId && topic && question) {
                await submitQuizAnswer({
                    user_id: user.id,
                    plan_id: planId,
                    subject_id: subjectId,
                    topic_name: topic,
                    question_difficulty: question.difficulty,
                    is_correct: optIdx === question.correct_index
                })
            }
        } catch (err) {
            console.error('Failed to submit answer:', err)
        }
    }

    const handleNext = () => {
        if (isLast) {
            navigate('/quiz/session-1/results', { state: { answers, questions, topic, planId } })
            return
        }
        setCurrentIndex(i => i + 1)
        setSelectedOption(null)
        setShowFeedback(false)
        setTimeLeft(TOTAL_TIME)
    }

    const isCorrect = question ? selectedOption === question.correct_index : false
    const timeProgress = (timeLeft / TOTAL_TIME) * 100

    const optionStyle = (idx: number) => {
        if (!question) return ''
        if (!showFeedback) {
            return selectedOption === idx
                ? 'border-indigo-500 bg-indigo-500/15 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
        }
        if (idx === question.correct_index) return 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
        if (idx === selectedOption && !isCorrect) return 'border-red-500 bg-red-500/15 text-red-300'
        return 'border-white/5 bg-white/3 text-slate-600'
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Preparing Assessment</h2>
                <p className="text-slate-400 text-center max-w-md">
                    {isGenerating
                        ? 'Evaluating your knowledge vector and crafting hyper-personalized questions via Gemini...'
                        : 'Retrieving questions matching your Target Difficulty from the Knowledge Graph...'}
                </p>
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-6 flex items-center gap-2 text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 text-sm font-medium"
                    >
                        <Sparkles className="w-4 h-4" /> AI Generation in Progress
                    </motion.div>
                )}
            </div>
        )
    }

    if (!questions.length) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
                <CircleAlert className="w-12 h-12 text-amber-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">
                    {!topic ? 'No Topic Selected' : 'Unable to Load Quiz'}
                </h2>
                <p className="text-slate-400 mb-6 text-center max-w-md">
                    {!topic
                        ? 'Navigate to a Roadmap and click a topic to start an adaptive quiz.'
                        : 'We could not generate questions for this topic. Please try again.'}
                </p>
                <button
                    onClick={() => navigate('/roadmaps')}
                    className="px-6 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 font-medium transition-colors"
                >
                    Go to Roadmaps
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
            <div className="w-full max-w-2xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                            {topic}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-slate-400">Question {currentIndex + 1} of {questions.length}</p>
                            {source === 'gemini' && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md font-medium uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Live Generated
                                </span>
                            )}
                        </div>
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
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
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
                        <MathText text={question.text} className="text-white text-lg md:text-xl font-semibold leading-relaxed" />
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
                                <span className="flex-1"><MathText text={opt} /></span>
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
                                <MathText text={question.explanation} className="text-slate-400 text-sm leading-relaxed" />
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
