import { motion } from 'framer-motion';
import { ArrowLeft, PlayCircle, FileText, CheckCircle2, Calendar, Download } from 'lucide-react';
import type { SyllabusResponse, AppState } from '../../types';

interface StudyPlanProps {
  data: SyllabusResponse;
  setAppState: (state: AppState) => void;
}

export default function StudyPlan({ data, setAppState }: StudyPlanProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto h-[85vh] flex flex-col pt-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <button 
            onClick={() => setAppState('dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group cursor-pointer text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Study Roadmap</h1>
          <p className="text-slate-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> 
            {data.subject_name} — Auto-generated plan
          </p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors text-slate-300 text-sm cursor-pointer">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm cursor-pointer">
            Start Learning
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative">
        <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-linear-to-b from-blue-500/50 via-purple-500/20 to-transparent" />
        
        <div className="space-y-12 pb-20">
          {data.modules.map((mod, i) => (
            <motion.div 
              key={mod.module_number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="relative pl-16 md:pl-20"
            >
              {/* Timeline Connector */}
              <div className="absolute left-[21px] top-6 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] ring-4 ring-slate-950" />
              
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 relative group hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 text-sm font-semibold text-blue-400 mb-3">
                  <span className="bg-blue-500/20 px-2.5 py-1 rounded-md">Week {i + 1}</span>
                  <span className="text-slate-500">•</span>
                  <span>{mod.module_number}</span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-6">{mod.title}</h2>
                
                <div className="space-y-4">
                  {mod.topics.map((topic, j) => (
                    <div key={j} className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <button className="mt-1 w-5 h-5 rounded-full border-2 border-slate-600 hover:border-green-400 transition-colors flex items-center justify-center group/check shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 opacity-0 group-hover/check:opacity-100 transition-opacity" />
                        </button>
                        <div>
                          <h3 className="text-slate-200 font-medium mb-1">{topic.title}</h3>
                          {topic.estimated_hours && (
                            <span className="text-xs text-slate-500">{topic.estimated_hours} estimate</span>
                          )}
                        </div>
                      </div>

                      {/* Resource Recommendations Mock */}
                      <div className="flex gap-2 shrink-0 md:ml-auto pl-9 md:pl-0">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-red-500/20">
                          <PlayCircle className="w-3.5 h-3.5" /> Video
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-blue-500/20">
                          <FileText className="w-3.5 h-3.5" /> Notes
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
