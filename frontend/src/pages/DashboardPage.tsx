import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, BookOpen, Flame, Map, ArrowRight, Play, Check } from 'lucide-react'

function CircularProgress({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r="20" className="stroke-white/10" strokeWidth="4" fill="none" />
        <motion.circle 
          cx="24" cy="24" r="20"
          className="stroke-indigo-500"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{progress}%</span>
    </div>
  )
}

function StreakCalendar() {
  // Mock 7 weeks x 7 days
  const weeks = Array.from({ length: 7 });
  const days = Array.from({ length: 7 });
  
  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        Study Streak
      </h3>
      <div className="flex gap-2">
        {weeks.map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            {days.map((_, j) => {
               // Randomize activity for visual
               const activity = Math.random();
               let bgClass = "bg-white/5";
               if (activity > 0.8) bgClass = "bg-indigo-500";
               else if (activity > 0.5) bgClass = "bg-indigo-500/60";
               else if (activity > 0.2) bgClass = "bg-indigo-500/30";
               
               return (
                 <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: (i * 7 + j) * 0.01 }}
                   key={j} 
                   className={`w-3 h-3 md:w-4 md:h-4 rounded-[2px] ${bgClass}`}
                 />
               )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="w-full min-h-[85vh] p-6 max-w-7xl mx-auto relative z-10 flex flex-col mt-4">
      {/* Hero / Quick Stats */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Welcome back, Alex! 👋</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Topics Mastered", value: "128", icon: <Check className="w-5 h-5 text-green-400" /> },
            { label: "Study Hours", value: "45h", icon: <Clock className="w-5 h-5 text-blue-400" /> },
            { label: "Current Streak", value: "12 Days", icon: <Flame className="w-5 h-5 text-orange-400" /> },
            { label: "Roadmaps", value: "4 Active", icon: <Map className="w-5 h-5 text-purple-400" /> }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col gap-2 relative overflow-hidden group hover:border-white/10 transition-colors"
            >
               <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
               <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mb-2 relative z-10">
                 {stat.icon}
               </div>
               <span className="text-2xl font-bold text-white relative z-10">{stat.value}</span>
               <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold relative z-10">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Continue Learning & Roadmaps */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Spotlight Card */}
          <section>
            <h2 className="text-xl font-bold mb-4 w-full border-b border-white/5 pb-2">Continue Learning</h2>
            <div className="glass-panel p-6 md:p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors" />
               <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                 <div>
                   <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-3 border border-indigo-500/30">
                     Introduction to Artificial Intelligence
                   </span>
                   <h3 className="text-2xl font-bold text-white mb-2">Neural Networks and Deep Learning</h3>
                   <p className="text-slate-400 text-sm mb-4">Module 2 • M2.2 Backpropagation Algorithm</p>
                 </div>
                 <Link 
                   to="/roadmap/1"
                   className="shrink-0 w-16 h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
                 >
                   <Play className="w-6 h-6 ml-1" fill="currentColor" />
                 </Link>
               </div>
            </div>
          </section>

          {/* In Progress Roadmaps */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h2 className="text-xl font-bold">In Progress</h2>
              <Link to="/roadmaps" className="text-indigo-400 text-sm hover:underline">View All</Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Calculus I & II", progress: 65 },
                { title: "Advanced Data Structures", progress: 32 }
              ].map((rm, i) => (
                <Link to="/roadmap/1" key={i} className="glass-panel p-5 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all flex items-center gap-4 group">
                   <CircularProgress progress={rm.progress} />
                   <div className="flex-1">
                     <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">{rm.title}</h4>
                     <p className="text-xs text-slate-500 mt-1">Last active 2 days ago</p>
                   </div>
                   <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Calendar & Recommended */}
        <div className="space-y-8">
           <StreakCalendar />

           {/* Recommended */}
           <div className="glass-panel p-6 rounded-3xl border border-white/5">
             <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">Recommended Next</h3>
             <div className="space-y-4">
               {[
                 { title: "Linear Algebra Fundamentals", topics: 15 },
                 { title: "Machine Learning Math", topics: 22 },
                 { title: "Python for Data Science", topics: 10 }
               ].map((rm, i) => (
                 <Link to="/roadmap/1" key={i} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                   <div className="flex flex-col">
                     <span className="font-semibold text-sm group-hover:text-indigo-300 transition-colors">{rm.title}</span>
                     <span className="text-xs text-slate-500 mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3"/> {rm.topics} Topics</span>
                   </div>
                   <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                 </Link>
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  )
}
