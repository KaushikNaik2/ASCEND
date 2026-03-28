import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface Props {
    xp: number
    compact?: boolean
}

const TIERS = [
    { label: 'Novice', min: 0, max: 500, color: 'from-slate-400 to-slate-500' },
    { label: 'Learner', min: 500, max: 2000, color: 'from-blue-400 to-cyan-500' },
    { label: 'Practitioner', min: 2000, max: 6000, color: 'from-violet-400 to-purple-500' },
    { label: 'Expert', min: 6000, max: 15000, color: 'from-amber-400 to-orange-500' },
]

export function getXPTier(xp: number) {
    return TIERS.find(t => xp >= t.min && xp < t.max) ?? TIERS[TIERS.length - 1]
}

export default function XPLevelBadge({ xp, compact = false }: Props) {
    const tier = getXPTier(xp)
    const progress = Math.min(((xp - tier.min) / (tier.max - tier.min)) * 100, 100)
    const level = TIERS.indexOf(tier) + 1

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center flex-shrink-0`}>
                    <Star className="w-3 h-3 text-white fill-white" />
                </div>
                <div>
                    <p className="text-xs font-bold text-white leading-none">{tier.label}</p>
                    <p className="text-[10px] text-slate-500">{xp.toLocaleString()} XP</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-5 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                        <Star className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-base">{tier.label}</p>
                        <p className="text-slate-500 text-xs">Level {level}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-extrabold text-white text-lg">{xp.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">/ {tier.max.toLocaleString()} XP</p>
                </div>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
                />
            </div>

            <div className="flex justify-between mt-1.5">
                <span className="text-slate-600 text-xs">{tier.min.toLocaleString()}</span>
                <span className="text-slate-600 text-xs">{tier.max.toLocaleString()} XP</span>
            </div>
        </div>
    )
}
