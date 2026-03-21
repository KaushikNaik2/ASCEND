import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'

const modeCards = [
    {
        id: 'academics' as const,
        icon: GraduationCap,
        title: 'Academics',
        subtitle: 'Structured learning from your curriculum',
        accent: 'blue',
        borderHover: 'hover:border-blue-500/70',
        glowHover: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.25)]',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        activeBorder: 'border-blue-500/40',
        gradient: 'from-blue-600 to-blue-400',
    },
    {
        id: 'skills' as const,
        icon: Zap,
        title: 'Skills',
        subtitle: 'Career-focused skill-building paths',
        accent: 'pink',
        borderHover: 'hover:border-pink-500/70',
        glowHover: 'hover:shadow-[0_0_40px_rgba(236,72,153,0.25)]',
        iconBg: 'bg-pink-500/20',
        iconColor: 'text-pink-400',
        activeBorder: 'border-pink-500/40',
        gradient: 'from-pink-600 to-purple-500',
    },
]

export default function ModeSelectionPage() {
    const navigate = useNavigate()
    const { setMode } = useStore()

    const handleSelect = (mode: 'academics' | 'skills') => {
        setMode(mode)
        navigate('/home')
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative z-10">
            {/* Heading */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-14"
            >
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
                    Choose Your Mode
                </h1>
                <p className="text-slate-400 text-lg">Select how you'd like to learn today</p>
            </motion.div>

            {/* Mode Cards */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
                {modeCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                        <motion.button
                            key={card.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(card.id)}
                            className={`flex-1 glass-panel rounded-3xl p-10 flex flex-col items-center gap-5 border ${card.activeBorder} ${card.borderHover} ${card.glowHover} transition-all duration-200 cursor-pointer group`}
                        >
                            {/* Icon */}
                            <div className={`w-20 h-20 rounded-2xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                <Icon className={`w-10 h-10 ${card.iconColor}`} />
                            </div>

                            {/* Text */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">{card.title}</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">{card.subtitle}</p>
                            </div>

                            {/* CTA pill */}
                            <div className={`px-6 py-2 rounded-full bg-gradient-to-r ${card.gradient} text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2`}>
                                Select →
                            </div>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
