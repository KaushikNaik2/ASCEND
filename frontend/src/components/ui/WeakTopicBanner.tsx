import { motion } from 'framer-motion'
import { TriangleAlert, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import type { ConceptCluster } from '../../types'

interface Props {
    weakClusters: ConceptCluster[]
    onRevisit: (clusterId: string) => void
}

export default function WeakTopicBanner({ weakClusters, onRevisit }: Props) {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed || weakClusters.length === 0) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mb-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2 text-amber-400 flex-shrink-0">
                    <TriangleAlert className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Weak Clusters</span>
                </div>

                <div className="flex flex-wrap gap-2 flex-1">
                    {weakClusters.slice(0, 3).map(c => (
                        <motion.button
                            key={c.id}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onRevisit(c.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-colors"
                        >
                            {c.label}
                            <span className="text-amber-500/60">{Math.round(c.mastery_score * 100)}%</span>
                            <ArrowRight className="w-3 h-3" />
                        </motion.button>
                    ))}
                </div>

                <button
                    onClick={() => setDismissed(true)}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors self-start sm:self-auto"
                >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
            </div>
        </motion.div>
    )
}
