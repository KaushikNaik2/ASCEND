import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import AppNavbar from '../components/layout/AppNavbar'
import type { SubjectChip } from '../types'

const mockAdded: SubjectChip[] = [
    { name: 'MATHEMATICS-I', status: 'verified' },
    { name: 'SOCIAL STUDIES', status: 'rejected' },
    { name: 'PHYSICS', status: 'verified' },
]

export default function UploadCurriculumPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pdfInputRef = useRef<HTMLInputElement>(null)
    const [subjects, setSubjects] = useState<SubjectChip[]>(mockAdded)
    const [scanning, setScanning] = useState(false)

    const handleScanClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        // Simulate processing — add a pending chip
        setScanning(true)
        setTimeout(() => {
            setSubjects((prev) => [
                ...prev,
                { name: file.name.replace(/\.[^.]+$/, '').toUpperCase(), status: 'verified' },
            ])
            setScanning(false)
        }, 1500)
        e.target.value = ''
    }

    const handleRetake = () => {
        fileInputRef.current?.click()
        // In real app would re-scan for that subject
    }

    return (
        <div className="min-h-screen relative z-10">
            {/* Navbar with all icons locked */}
            <AppNavbar locked />

            <div className="pt-24 px-4 md:px-8 pb-10 max-w-4xl mx-auto">
                {/* Page Header */}
                <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-widest mb-8">
                    UPLOAD CURRICULUM
                </h1>

                {/* Two-column layout */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column — Scan box */}
                    <div className="flex flex-col gap-4">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                            SCAN YOUR TEXTBOOK INDEXES TO ADD THE SUBJECTS
                        </p>

                        {/* Scan target box */}
                        <button
                            onClick={handleScanClick}
                            disabled={scanning}
                            className="relative w-full aspect-[4/3] scan-box flex flex-col items-center justify-center gap-4 hover:border-indigo-400/80 transition-colors group bg-slate-900/40 backdrop-blur-sm rounded-xl"
                        >
                            {/* Animated corner brackets */}
                            <ScanCorners />

                            {scanning ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent"
                                />
                            ) : (
                                <>
                                    <Camera className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-slate-400 text-sm font-medium">Tap to scan / upload image</span>
                                </>
                            )}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <p className="text-slate-500 text-xs italic leading-relaxed">
                            *NOTE: THESE INDEXES WOULD BE CROSS-REFERENCED WITH OFFICIAL WEBSITES FOR ACCURACY
                        </p>
                    </div>

                    {/* Right Column — Subjects Added */}
                    <div>
                        <p className="text-white font-bold uppercase tracking-widest text-sm mb-4">
                            SUBJECTS ADDED:
                        </p>

                        <div className="flex flex-col gap-3">
                            {subjects.map((chip, i) => (
                                <motion.div
                                    key={`${chip.name}-${i}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <SubjectChipCard chip={chip} onRetake={handleRetake} />
                                </motion.div>
                            ))}
                        </div>

                        {/* Digital copy link */}
                        <div className="mt-6">
                            <p className="text-slate-500 text-xs mb-1">* Have a digital copy?</p>
                            <button
                                onClick={() => pdfInputRef.current?.click()}
                                className="flex items-center gap-1.5 text-blue-400 text-sm underline hover:text-blue-300 transition-colors font-semibold"
                            >
                                UPLOAD HERE <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <input
                                ref={pdfInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SubjectChipCard({ chip, onRetake }: { chip: SubjectChip; onRetake: () => void }) {
    const verified = chip.status === 'verified'

    return (
        <div
            className={`flex items-center justify-between px-4 py-2.5 rounded-full border font-semibold text-sm ${verified
                ? 'bg-green-500/10 border-green-400/50 text-green-300'
                : 'bg-red-500/10 border-red-400/50 text-red-300'
                }`}
        >
            <span className="truncate">{chip.name}</span>
            <div className="flex items-center gap-2 shrink-0 ml-3">
                {verified ? (
                    <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> *VERIFIED
                    </span>
                ) : (
                    <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> *REJECTED
                        <button
                            onClick={onRetake}
                            className="ml-2 text-blue-400 underline font-medium hover:text-blue-300 transition-colors"
                        >
                            retake
                        </button>
                    </span>
                )}
            </div>
        </div>
    )
}

// Animated corner bracket SVG overlay
function ScanCorners() {
    const cornerClass = 'absolute w-6 h-6 border-indigo-400 transition-all duration-300 group-hover:border-indigo-300'
    return (
        <>
            <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
                <span className={`${cornerClass} border-l-2 border-t-2 top-3 left-3 rounded-tl-sm`} />
                <span className={`${cornerClass} border-r-2 border-t-2 top-3 right-3 rounded-tr-sm`} />
                <span className={`${cornerClass} border-l-2 border-b-2 bottom-3 left-3 rounded-bl-sm`} />
                <span className={`${cornerClass} border-r-2 border-b-2 bottom-3 right-3 rounded-br-sm`} />
            </motion.span>
        </>
    )
}
