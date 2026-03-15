import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileType, CheckCircle2, Bot, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AppState } from '../../types';

interface ProcessingViewProps {
  setAppState: (state: AppState) => void;
  fileName: string;
}

export default function ProcessingView({ setAppState, fileName }: ProcessingViewProps) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    { title: "Extracting text with PDFPlumber...", icon: FileType },
    { title: "Analyzing structure with AI...", icon: Bot },
    { title: "Structuring modules and topics...", icon: Loader2 },
    { title: "Finalizing JSON schema...", icon: CheckCircle2 },
    { title: "Roadmap Generated Successfully!", icon: Sparkles }
  ];

  useEffect(() => {
    // Mock processing sequence
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100;
        const newProgress = p + (Math.random() * 5);
        
        // Update step based on progress
        if (newProgress >= 100) setStep(4);
        else if (newProgress > 85) setStep(3);
        else if (newProgress > 50) setStep(2);
        else if (newProgress > 25) setStep(1);
        
        return newProgress;
      });
    }, 150);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        setAppState('dashboard');
      }, 2200);
      return () => clearTimeout(timeout);
    }
  }, [progress, setAppState]);

  const CurrentIcon = steps[step].icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center w-full max-w-lg mx-auto"
    >
      {/* 3D-like CSS Atom that bursts out and flies into the background */}
      <AnimatePresence>
        {step === 4 && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: 0, y: '-50%' }}
            animate={{ 
              scale: [0, 1.8, 0.1], 
              opacity: [0, 1, 0],
              y: ['-50%', '-80%', '-20%'],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2.2, 
              times: [0, 0.4, 1], 
              ease: "easeIn" 
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="w-24 h-24 rounded-full border border-green-400/60 bg-green-500/20 shadow-[0_0_40px_rgba(52,211,153,0.8)] backdrop-blur-md flex items-center justify-center relative">
               <div className="absolute w-full h-full border border-green-300/40 rounded-[45%] rotate-45" />
               <div className="absolute w-full h-full border border-green-300/40 rounded-[45%] -rotate-45" />
               <div className="absolute w-12 h-24 border border-green-300/30 rounded-full" />
               <div className="absolute w-24 h-12 border border-green-300/30 rounded-full" />
               <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse absolute" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel p-10 rounded-3xl border border-white/10 relative overflow-hidden w-full">
        {/* Glow behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl transition-colors duration-500" style={{ backgroundColor: step === 4 ? 'rgba(52, 211, 153, 0.3)' : 'rgba(59, 130, 246, 0.3)' }} />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {step < 4 ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 rounded-full border-t-2 border-r-2 border-blue-400 border-opacity-50 mb-8 flex items-center justify-center relative"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-2 border-r-2 border-blue-400 border-opacity-50"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 rounded-full border-b-2 border-l-2 border-purple-400 absolute"
                />
                <CurrentIcon className={`w-8 h-8 ${step === 3 ? 'text-green-400' : 'text-blue-400'} animate-pulse`} />
              </motion.div>
            ) : (
              <motion.div 
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-linear-to-br from-green-400 to-emerald-600 mb-8 flex items-center justify-center relative shadow-[0_0_30px_rgba(52,211,153,0.5)]"
              >
                <CurrentIcon className="w-10 h-10 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 4 ? "Generation Complete!" : "Analyzing Syllabus"}
          </h2>
          <p className="text-slate-400 text-sm mb-8 font-mono">{fileName}</p>

          <div className="w-full space-y-3 relative">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={step === 4 ? "text-green-300" : "text-blue-200"}
              >
                {steps[step].title}
              </motion.span>
              <span className="tabular-nums">{Math.min(100, Math.floor(progress))}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${step === 4 ? 'bg-green-500' : 'bg-linear-to-r from-blue-500 to-purple-500'}`}
                animate={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
            {/* Fake scanning line effect only when processing */}
            {step < 4 && (
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 w-1/3 h-20 bg-linear-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] pointer-events-none"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

