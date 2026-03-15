import { motion } from 'framer-motion';
import { BookOpen, Calendar, Clock, Plus, ArrowRight, Grid, List } from 'lucide-react';
import type { AppState } from '../../types';

interface DashboardProps {
  setAppState: (state: AppState) => void;
}

const mockHistory = [
  { id: 1, subject: "Introduction to Artificial Intelligence", semester: "Fall 2026", date: "2 days ago", modules: 3 },
  { id: 2, subject: "Advanced Data Structures", semester: "Fall 2026", date: "1 week ago", modules: 5 },
  { id: 3, subject: "Quantum Computing Ethics", semester: "Spring 2027", date: "2 weeks ago", modules: 4 },
];

export default function Dashboard({ setAppState }: DashboardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto h-[80vh] flex flex-col pt-4"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Your Knowledge Base</h1>
          <p className="text-slate-400">Manage and explore your parsed syllabi.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex p-1 bg-white/5 rounded-lg border border-white/10">
            <button className="p-2 bg-white/10 rounded-md text-white"><Grid className="w-4 h-4" /></button>
            <button className="p-2 text-slate-400 hover:text-white"><List className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={() => setAppState('upload')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Syllabus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2">
        {mockHistory.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 hover:border-blue-500/30 hover:bg-white/10 transition-all flex flex-col h-full group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen className="w-24 h-24 text-blue-400 -m-8 -rotate-12" />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-4 bg-blue-500/10 w-fit px-3 py-1 rounded-full relative z-10">
              <Calendar className="w-3.5 h-3.5" />
              {item.semester}
            </div>

            <h3 className="text-lg font-bold text-white mb-2 leading-snug relative z-10">{item.subject}</h3>
            
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-8 relative z-10">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {item.modules} Modules</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {item.date}</span>
            </div>

            <div className="mt-auto flex gap-3 relative z-10">
              <button 
                onClick={() => setAppState('results')}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors cursor-pointer text-center"
              >
                View Details
              </button>
              <button 
                onClick={() => setAppState('studyplan')}
                className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-sm font-medium transition-colors cursor-pointer text-white"
              >
                Study Plan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
