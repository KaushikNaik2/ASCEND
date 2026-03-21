import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, Square, ChevronRight } from 'lucide-react'
import AppNavbar from '../components/layout/AppNavbar'
import { useStore } from '../store/useStore'

interface Topic {
    id: string
    title: string
    completed: boolean
}

interface RoadmapModule {
    id: string
    title: string
    topics: Topic[]
    expanded: boolean
}

// Mock roadmap data
const initial: RoadmapModule[] = [
    {
        id: 'm1',
        title: 'Module 1 — Foundations',
        expanded: true,
        topics: [
            { id: 't1', title: 'Introduction & Overview', completed: true },
            { id: 't2', title: 'Core Concepts', completed: true },
            { id: 't3', title: 'Basic Terminology', completed: false },
        ],
    },
    {
        id: 'm2',
        title: 'Module 2 — Intermediate Concepts',
        expanded: false,
        topics: [
            { id: 't4', title: 'Data Structures', completed: false },
            { id: 't5', title: 'Algorithms', completed: false },
            { id: 't6', title: 'Complexity Analysis', completed: false },
        ],
    },
    {
        id: 'm3',
        title: 'Module 3 — Advanced Topics',
        expanded: false,
        topics: [
            { id: 't7', title: 'System Design Principles', completed: false },
            { id: 't8', title: 'Optimization Techniques', completed: false },
            { id: 't9', title: 'Real-world Applications', completed: false },
            { id: 't10', title: 'Project & Assessment', completed: false },
        ],
    },
]

export default function RoadmapPage() {
    const [modules, setModules] = useState<RoadmapModule[]>(initial)
    const { signupData } = useStore()

    const totalTopics = modules.flatMap((m) => m.topics).length
    const completedTopics = modules.flatMap((m) => m.topics).filter((t) => t.completed).length
    const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

    const toggleTopic = (moduleId: string, topicId: string) => {
        setModules((prev) =>
            prev.map((mod) =>
                mod.id === moduleId
                    ? {
                        ...mod,
                        topics: mod.topics.map((t) =>
                            t.id === topicId ? { ...t, completed: !t.completed } : t
                        ),
                    }
                    : mod
            )
        )
    }

    const toggleModule = (moduleId: string) => {
        setModules((prev) =>
            prev.map((mod) => (mod.id === moduleId ? { ...mod, expanded: !mod.expanded } : mod))
        )
    }

    return (
        <div className="min-h-screen relative z-10">
            <AppNavbar />

            <div className="pt-24 pb-12 px-4 md:px-8 max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-white mb-1 uppercase tracking-widest">
                        {signupData.courseName || 'My'} Roadmap
                    </h1>
                    <p className="text-slate-400 text-sm">{completedTopics} / {totalTopics} topics completed</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                        <span>PROGRESS</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        />
                    </div>
                </div>

                {/* Modules */}
                <div className="flex flex-col gap-4">
                    {modules.map((mod, mi) => (
                        <div key={mod.id} className="glass-panel rounded-2xl overflow-hidden">
                            {/* Module Header */}
                            <button
                                onClick={() => toggleModule(mod.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                                        {mi + 1}
                                    </div>
                                    <span className="text-white font-semibold text-sm">{mod.title}</span>
                                </div>
                                <ChevronRight
                                    className={`w-4 h-4 text-slate-400 transition-transform ${mod.expanded ? 'rotate-90' : ''}`}
                                />
                            </button>

                            {/* Topics */}
                            {mod.expanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="border-t border-white/10"
                                >
                                    {mod.topics.map((topic, ti) => (
                                        <motion.button
                                            key={topic.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: ti * 0.06 }}
                                            onClick={() => toggleTopic(mod.id, topic.id)}
                                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                                        >
                                            {topic.completed ? (
                                                <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                                            ) : (
                                                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                                            )}
                                            <span className={`text-sm ${topic.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                                {topic.title}
                                            </span>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
