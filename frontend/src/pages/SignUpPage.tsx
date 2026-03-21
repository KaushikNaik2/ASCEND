import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, GraduationCap, Briefcase, ChevronDown } from 'lucide-react'
import { useStore } from '../store/useStore'

const TOTAL_STEPS = 3

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? 100 : -100, opacity: 0 }),
}

export default function SignUpPage() {
    const [step, setStep] = useState(1)
    const [direction, setDirection] = useState(1)
    const navigate = useNavigate()
    const { signupData, setSignupData, setAuthenticated } = useStore()

    // Field validation
    const [errors, setErrors] = useState<Record<string, string>>({})

    const goTo = (next: number) => {
        setDirection(next > step ? 1 : -1)
        setStep(next)
    }

    const validateStep1 = () => {
        const e: Record<string, string> = {}
        if (!signupData.name.trim()) e.name = 'Full name is required'
        if (!signupData.dob) e.dob = 'Date of birth is required'
        if (!signupData.phone.trim()) e.phone = 'Phone number is required'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const validateStep2 = () => {
        const e: Record<string, string> = {}
        if (!signupData.profession) e.profession = 'Please select your profession'
        if (!signupData.workplace.trim()) e.workplace = 'This field is required'
        if (!signupData.qualification.trim()) e.qualification = 'This field is required'
        if (signupData.hasCurrentCourse === null) e.hasCurrentCourse = 'Please select Yes or No'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleStep2Next = () => {
        if (!validateStep2()) return
        if (signupData.hasCurrentCourse) {
            goTo(3)
        } else {
            setAuthenticated(true)
            navigate('/mode-selection')
        }
    }

    const handleComplete = () => {
        const e: Record<string, string> = {}
        if (!signupData.courseName.trim()) e.courseName = 'Course name is required'
        if (!signupData.university.trim()) e.university = 'University is required'
        if (!signupData.city.trim()) e.city = 'City is required'
        setErrors(e)
        if (Object.keys(e).length > 0) return
        setAuthenticated(true)
        navigate('/mode-selection')
    }

    return (
        <div className="min-h-screen flex">
            {/* Left decorative panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex-col items-center justify-center p-12">
                <div className="absolute inset-0 opacity-20">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full border border-white/10"
                            style={{
                                width: `${(i + 1) * 120}px`,
                                height: `${(i + 1) * 120}px`,
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-2xl mx-auto mb-6">
                        A
                    </div>
                    <h2 className="text-4xl font-extrabold text-white mb-4">Join ASCEND</h2>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-xs">
                        Your AI-powered personalized learning journey begins here.
                    </p>
                    {/* Step indicators */}
                    <div className="flex gap-3 justify-center mt-12">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-blue-400' : s < step ? 'w-8 bg-blue-600' : 'w-4 bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-slate-500 text-sm mt-3">Step {step} of {TOTAL_STEPS}</p>
                </motion.div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-950 relative overflow-hidden">
                {/* Mobile progress */}
                <div className="flex gap-2 mb-8 lg:hidden">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-blue-400' : s < step ? 'w-8 bg-blue-600' : 'w-4 bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                <div className="w-full max-w-md relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <h3 className="text-2xl font-bold text-white mb-1">Personal Details</h3>
                                <p className="text-slate-400 text-sm mb-8">Tell us a bit about yourself to get started.</p>

                                <div className="space-y-5">
                                    <Field label="Full Name" error={errors.name}>
                                        <input
                                            type="text"
                                            placeholder="Prathamesh Pangle"
                                            value={signupData.name}
                                            onChange={(e) => setSignupData({ name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </Field>

                                    <Field label="Date of Birth" error={errors.dob}>
                                        <input
                                            type="date"
                                            value={signupData.dob}
                                            onChange={(e) => setSignupData({ dob: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                                        />
                                    </Field>

                                    <Field label="Phone Number" error={errors.phone}>
                                        <div className="flex gap-2">
                                            <div className="relative">
                                                <select className="appearance-none pl-3 pr-8 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm">
                                                    <option value="+91">🇮🇳 +91</option>
                                                    <option value="+1">🇺🇸 +1</option>
                                                    <option value="+44">🇬🇧 +44</option>
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="9876543210"
                                                value={signupData.phone}
                                                onChange={(e) => setSignupData({ phone: e.target.value })}
                                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </Field>
                                </div>

                                <button
                                    onClick={() => { if (validateStep1()) goTo(2) }}
                                    className="w-full mt-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>

                                <p className="text-center text-slate-500 text-sm mt-6">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign In</Link>
                                </p>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <h3 className="text-2xl font-bold text-white mb-1">Professional Details</h3>
                                <p className="text-slate-400 text-sm mb-8">Help us personalise your learning path.</p>

                                <div className="space-y-5">
                                    {/* Profession pill cards */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Profession</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'student', label: 'Student', icon: GraduationCap },
                                                { value: 'working_professional', label: 'Working Professional', icon: Briefcase },
                                            ].map(({ value, label, icon: Icon }) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => setSignupData({ profession: value as any })}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${signupData.profession === value
                                                            ? 'border-blue-500 bg-blue-500/20 text-white'
                                                            : 'border-white/10 bg-slate-800/50 text-slate-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    <Icon className="w-6 h-6" />
                                                    <span className="text-xs font-semibold text-center">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.profession && <p className="text-red-400 text-xs mt-1">{errors.profession}</p>}
                                    </div>

                                    <Field label="School / College / Company Name" error={errors.workplace}>
                                        <input
                                            type="text"
                                            placeholder="IIT Bombay / Google"
                                            value={signupData.workplace}
                                            onChange={(e) => setSignupData({ workplace: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </Field>

                                    <Field label="Qualification" error={errors.qualification}>
                                        <input
                                            type="text"
                                            placeholder="B.Tech CSE Year 2"
                                            value={signupData.qualification}
                                            onChange={(e) => setSignupData({ qualification: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </Field>

                                    {/* Current Course Yes/No */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Do you have a current course?</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(({ label, value }) => (
                                                <button
                                                    key={String(value)}
                                                    type="button"
                                                    onClick={() => setSignupData({ hasCurrentCourse: value })}
                                                    className={`py-3 rounded-full font-bold text-sm border transition-all ${signupData.hasCurrentCourse === value
                                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white'
                                                            : 'border-white/10 bg-slate-800/50 text-slate-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.hasCurrentCourse && <p className="text-red-400 text-xs mt-1">{errors.hasCurrentCourse}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-8">
                                    <button
                                        onClick={() => goTo(1)}
                                        className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={handleStep2Next}
                                        className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        Next <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <h3 className="text-2xl font-bold text-white mb-1">Course Details</h3>
                                <p className="text-slate-400 text-sm mb-8">Tell us about your current course so we can tailor your roadmap.</p>

                                <div className="space-y-5">
                                    <Field label="Course Name" error={errors.courseName}>
                                        <input
                                            type="text"
                                            placeholder="B.Tech Computer Science"
                                            value={signupData.courseName}
                                            onChange={(e) => setSignupData({ courseName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </Field>

                                    <Field label="University / Institution" error={errors.university}>
                                        <input
                                            type="text"
                                            placeholder="IIT Bombay"
                                            value={signupData.university}
                                            onChange={(e) => setSignupData({ university: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </Field>

                                    <Field label="City" error={errors.city}>
                                        <input
                                            type="text"
                                            placeholder="Mumbai"
                                            value={signupData.city}
                                            onChange={(e) => setSignupData({ city: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </Field>
                                </div>

                                <div className="flex items-center gap-4 mt-8">
                                    <button
                                        onClick={() => goTo(2)}
                                        className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back
                                    </button>
                                    <button
                                        onClick={handleComplete}
                                        className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
                                    >
                                        Complete Sign Up <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}

// Reusable field wrapper
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
            {children}
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    )
}
