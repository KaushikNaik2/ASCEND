import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Lock, GraduationCap, Briefcase, Code, Building2, BookOpen, Calendar, MapPin } from 'lucide-react';
import { useState } from 'react';

interface AuthFormProps {
  type: 'login' | 'signup';
  onBack: () => void;
  onSubmit: (data?: any) => void;
  onSwitchMode: () => void;
}

export default function AuthForm({ type, onBack, onSubmit, onSwitchMode }: AuthFormProps) {
  const [stage, setStage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: '',
    currentCourse: '',
    currentYear: '',
    passoutYear: '',
    universityName: '',
    collegeName: '',
    stream: '',
    selectedCourses: [] as string[]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (type === 'signup' && stage < 3) {
      setStage(stage + 1);
    } else {
      onSubmit(formData);
    }
  };

  const handleBackStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stage > 1) {
      setStage(stage - 1);
    }
  };

  const handleCourseToggle = (course: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(course)
        ? prev.selectedCourses.filter(c => c !== course)
        : [...prev.selectedCourses, course]
    }));
  };

  const userTypes = [
    { id: 'student', label: 'Student', icon: <GraduationCap className="h-6 w-6 mb-2" /> },
    { id: 'professional', label: 'Working Professional', icon: <Briefcase className="h-6 w-6 mb-2" /> },
    { id: 'freelancer', label: 'Freelancer', icon: <Code className="h-6 w-6 mb-2" /> }
  ];

  const STREAMS = ['Engineering', 'Business', 'Arts', 'Science', 'Medical', 'Other'];

  const COURSE_RECOMMENDATIONS: Record<string, string[]> = {
    'Engineering': ['Data Structures & Algorithms', 'System Design', 'Machine Learning 101', 'Web Development Bootcamp'],
    'Business': ['Financial Accounting', 'Marketing Principles', 'Economics'],
    'Arts': ['Psychology 101', 'Sociology', 'Creative Writing'],
    'Science': ['Quantum Mechanics', 'Organic Chemistry', 'Calculus'],
    'Medical': ['Human Anatomy', 'Pharmacology Basics']
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to home</span>
      </button>

      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 mb-8 relative z-10">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {type === 'login' ? 'Welcome back'
              : stage === 1 ? 'Create an account'
                : stage === 2 ? 'Tell us about you'
                  : 'Education Details'}
          </h2>
          <p className="text-slate-400 text-sm h-5">
            {type === 'login'
              ? 'Enter your credentials to access your saved syllabi.'
              : stage === 1 ? 'Join ASCEND to digitize your curriculum.'
                : stage === 2 ? 'Select your current professional status.'
                  : 'Help us personalize your learning path.'}
          </p>
        </div>

        {/* Progress Dots for Signup */}
        {type === 'signup' && (
          <div className="flex gap-2 mb-8 justify-center relative z-10">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${stage >= step ? 'w-8 bg-blue-500' : 'w-4 bg-slate-700/50'}`}
              />
            ))}
          </div>
        )}

        <form className="space-y-4 relative z-10" onSubmit={handleNext}>
          <AnimatePresence mode="wait">
            {/* STAGE 1 & LOGIN */}
            {(type === 'login' || stage === 1) && (
              <motion.div
                key="stage1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {type === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 ml-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 ml-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@university.edu"
                      required
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-medium text-slate-300 ml-1">Password</label>
                    {type === 'login' && <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</a>}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 2 */}
            {type === 'signup' && stage === 2 && (
              <motion.div
                key="stage2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-3 gap-3"
              >
                {userTypes.map((ut) => (
                  <div
                    key={ut.id}
                    onClick={() => setFormData({ ...formData, userType: ut.id })}
                    className={`cursor-pointer rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all border ${formData.userType === ut.id
                        ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800/50 hover:border-slate-600'
                      }`}
                  >
                    <div className={formData.userType === ut.id ? 'text-blue-400' : 'text-slate-400'}>
                      {ut.icon}
                    </div>
                    <span className={`text-xs font-medium ${formData.userType === ut.id ? 'text-white' : 'text-slate-300'}`}>
                      {ut.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* STAGE 3 */}
            {type === 'signup' && stage === 3 && (
              <motion.div
                key="stage3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 ml-1">Stream (Perceived/Perceiving)</label>
                  <select
                    name="stream"
                    value={formData.stream}
                    onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, selectedCourses: [] })); // Reset courses when stream changes
                    }}
                    required
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-500">Select your stream</option>
                    {STREAMS.map(s => (
                      <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                    ))}
                  </select>
                </div>

                {formData.stream && COURSE_RECOMMENDATIONS[formData.stream] && (
                  <div className="space-y-2 pt-2 pb-2">
                    <label className="text-xs font-medium text-slate-300 ml-1">Optional: Recommended Courses for {formData.stream}</label>
                    <div className="grid grid-cols-1 gap-2">
                      {COURSE_RECOMMENDATIONS[formData.stream].map(course => (
                        <div
                          key={course}
                          onClick={() => handleCourseToggle(course)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${formData.selectedCourses.includes(course) ? 'bg-blue-500/20 border-blue-500 text-blue-100' : 'bg-slate-900/40 border-slate-700/50 text-slate-300 hover:border-slate-500'}`}
                        >
                          <span className="text-sm font-medium">{course}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.selectedCourses.includes(course) ? 'border-blue-500 bg-blue-500' : 'border-slate-500'}`}>
                            {formData.selectedCourses.includes(course) && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 ml-1">Current Course / Degree</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="currentCourse"
                      value={formData.currentCourse}
                      onChange={handleChange}
                      placeholder="e.g. B.Tech Computer Science"
                      required
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 ml-1">Current Year</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        name="currentYear"
                        value={formData.currentYear}
                        onChange={handleChange}
                        placeholder="e.g. 3rd Year"
                        required
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 ml-1">Passout Year</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        name="passoutYear"
                        value={formData.passoutYear}
                        onChange={handleChange}
                        placeholder="e.g. 2025"
                        required
                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 ml-1">University Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="universityName"
                      value={formData.universityName}
                      onChange={handleChange}
                      placeholder="e.g. Stanford University"
                      required
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 ml-1">College Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      name="collegeName"
                      value={formData.collegeName}
                      onChange={handleChange}
                      placeholder="e.g. College of Engineering"
                      required
                      className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-6 pt-2">
            {type === 'signup' && stage > 1 && (
              <button
                type="button"
                onClick={handleBackStep}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-all cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              type="submit"
              disabled={type === 'signup' && stage === 2 && !formData.userType}
              className={`flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer ${(type === 'signup' && stage === 2 && !formData.userType) ? 'opacity-50 hover:scale-100 cursor-not-allowed filter grayscale' : ''
                }`}
            >
              {type === 'login' ? 'Sign In' : (stage < 3 ? 'Continue' : 'Complete Sign Up')}
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6 pb-2">
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                if (type === 'signup') setStage(1);
                setFormData({
                  name: '', email: '', password: '', userType: '', currentCourse: '',
                  currentYear: '', passoutYear: '', universityName: '', collegeName: '',
                  stream: '', selectedCourses: []
                });
                onSwitchMode();
              }}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              {type === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </div>
    </motion.div>
  );
}
