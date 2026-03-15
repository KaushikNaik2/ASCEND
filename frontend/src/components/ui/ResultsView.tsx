import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown, BookOpen, Clock, Calendar } from 'lucide-react';
import type { SyllabusResponse, AppState } from '../../types';

interface ResultsViewProps {
  data: SyllabusResponse;
  setAppState: (state: AppState) => void;
}

export default function ResultsView({ data, setAppState }: ResultsViewProps) {
  const [copied, setCopied] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(data.modules[0]?.module_number || null);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col pt-8"
    >
      {/* Header Info */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">{data.subject_name}</h2>
          <div className="flex gap-4 text-sm text-slate-300">
            {data.semester && (
              <span className="flex items-center gap-1.5 bg-white/5 py-1 px-3 rounded-full">
                <Calendar className="w-4 h-4 text-blue-400" />
                {data.semester}
              </span>
            )}
            <span className="flex items-center gap-1.5 bg-white/5 py-1 px-3 rounded-full">
              <BookOpen className="w-4 h-4 text-purple-400" />
              {data.modules.length} Modules
            </span>
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className="relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors text-sm font-medium cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>

      {/* Modules Accordion List */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-4 custom-scrollbar relative z-10">
        {data.modules.map((mod, i) => {
          const isExpanded = expandedModule === mod.module_number;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={mod.module_number}
              className={`glass-panel border rounded-2xl overflow-hidden transition-colors ${
                isExpanded ? 'border-blue-500/30 bg-slate-900/60' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <button
                onClick={() => setExpandedModule(isExpanded ? null : mod.module_number)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                    isExpanded ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-300'
                  }`}>
                    {mod.module_number}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">{mod.title}</h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 pl-16 md:pl-20 border-t border-white/5">
                      <ul className="space-y-3 pt-4">
                        {mod.topics.map((topic, j) => (
                          <motion.li 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: j * 0.05 }}
                            key={j}
                            className="flex items-start gap-3 text-slate-300"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50 mt-2 shrink-0" />
                            <div className="flex-1">
                              <span className="text-[15px]">{topic.title}</span>
                            </div>
                            {topic.estimated_hours && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 bg-slate-800/50 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5" />
                                {topic.estimated_hours}
                              </div>
                            )}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      <motion.div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button 
          onClick={() => setAppState('upload')}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full font-medium text-sm transition-all cursor-pointer shadow-lg shadow-black/20"
        >
          Parse Another Syllabus
        </button>
      </motion.div>

    </motion.div>
  );
}
