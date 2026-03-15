import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { AppState } from '../../types';

interface ErrorViewProps {
  setAppState: (state: AppState) => void;
  errorMessage?: string;
}

export default function ErrorView({ setAppState, errorMessage = "We couldn't parse the syllabus. Please make sure it's a valid PDF." }: ErrorViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
      className="flex flex-col items-center justify-center w-full max-w-md mx-auto"
    >
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-red-500/20 relative overflow-hidden w-full text-center">
        {/* Subtle red glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, bounce: 0.6 }}
            className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center mb-6"
          >
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-3">Parsing Failed</h2>
          <p className="text-slate-400 text-sm mb-8">
            {errorMessage}
          </p>

          <button 
            onClick={() => setAppState('upload')}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors text-sm font-medium text-white cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </motion.div>
  );
}
