import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Lock, Building2 } from 'lucide-react';
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
    universityName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (type === 'signup' && stage < 2) {
      setStage(2);
    } else {
      onSubmit(formData);
    }
  };

  const handleBackStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stage > 1) setStage(stage - 1);
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
                : 'Your University'}
          </h2>
          <p className="text-slate-400 text-sm h-5">
            {type === 'login'
              ? 'Enter your credentials to access your saved syllabi.'
              : stage === 1 ? 'Join ASCEND to digitize your curriculum.'
                : 'Help us personalize your learning experience.'}
          </p>
        </div>

        {/* Progress Dots for Signup */}
        {type === 'signup' && (
          <div className="flex gap-2 mb-8 justify-center relative z-10">
            {[1, 2].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${stage >= step ? 'w-8 bg-blue-500' : 'w-4 bg-slate-700/50'}`}
              />
            ))}
          </div>
        )}

        <form className="space-y-4 relative z-10" onSubmit={handleNext}>
          <AnimatePresence mode="wait">
            {/* STAGE 1: Credentials */}
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

            {/* STAGE 2: University */}
            {type === 'signup' && stage === 2 && (
              <motion.div
                key="stage2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
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
                      placeholder="e.g. Mumbai University"
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
              className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              {type === 'login' ? 'Sign In' : (stage < 2 ? 'Continue' : 'Complete Sign Up')}
            </button>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6 pb-2">
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                if (type === 'signup') setStage(1);
                setFormData({ name: '', email: '', password: '', universityName: '' });
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
