import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Lock } from 'lucide-react';

interface AuthFormProps {
  type: 'login' | 'signup';
  onBack: () => void;
  onSubmit: () => void;
  onSwitchMode: () => void;
}

export default function AuthForm({ type, onBack, onSubmit, onSwitchMode }: AuthFormProps) {
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
            {type === 'login' ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-slate-400 text-sm">
            {type === 'login' 
              ? 'Enter your credentials to access your saved syllabi.' 
              : 'Join ASCEND to digitize your curriculum.'}
          </p>
        </div>

        <form className="space-y-4 relative z-10" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          
          {type === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="John Doe"
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
                placeholder="you@university.edu"
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
                placeholder="••••••••"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            {type === 'login' ? 'Sign In' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6 pb-2">
            {type === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={onSwitchMode}
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
