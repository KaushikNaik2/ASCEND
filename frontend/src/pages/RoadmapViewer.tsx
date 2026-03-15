import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Bot, PlayCircle, FileText, ChevronRight, X } from 'lucide-react'
import { mockSyllabus } from '../lib/mockData'

export default function RoadmapViewer() {
  // Uses mock data for now
  const roadmap = mockSyllabus 
  const [completedTopics, setCompletedTopics] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const totalTopics = roadmap.modules.reduce((acc, m) => acc + m.topics.length, 0)
  const progress = totalTopics > 0 ? Math.round((completedTopics.length / totalTopics) * 100) : 0

  const toggleComplete = (topicTitle: string) => {
    setCompletedTopics(prev => 
      prev.includes(topicTitle) 
        ? prev.filter(t => t !== topicTitle)
        : [...prev, topicTitle]
    )
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col md:flex-row z-10">
      <div ref={containerRef} className="flex-1 overflow-y-auto pb-32 px-4 md:px-8 mt-4 disable-scrollbar">
        {/* Header / Progress */}
        <div className="max-w-3xl mx-auto mb-16 pt-8">
           <h1 className="text-3xl md:text-5xl font-bold mb-4 font-sans tracking-tight">{roadmap.subject_name}</h1>
           <div className="flex items-center justify-between mb-2">
             <span className="text-slate-400 font-medium">Your Progress</span>
             <span className="font-bold text-indigo-400 text-xl">{progress}%</span>
           </div>
           <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-linear-to-r from-indigo-500 to-purple-500"
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ duration: 0.5, ease: "easeOut" }}
             />
           </div>
        </div>

        {/* Tree Layout */}
        <div className="max-w-3xl mx-auto relative mt-10">
          {/* Main Vertical Line */}
          <div className="absolute left-8 lg:left-1/2 top-4 bottom-4 w-1 bg-linear-to-b from-indigo-500/50 via-purple-500/50 to-transparent lg:-translate-x-1/2 rounded-full" />

          {roadmap.modules.map((mod, i) => (
            <div key={i} className="mb-20 relative w-full flex flex-col lg:flex-row items-start lg:items-center justify-center">
              
              {/* Module Node (Center on Desktop) */}
              <div className="absolute left-8 lg:left-1/2 top-0 lg:top-1/2 -translate-x-[45%] lg:-translate-x-1/2 translate-y-0 lg:-translate-y-1/2 z-10">
                 <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center font-bold text-md lg:text-lg border-2 border-indigo-400">
                   {mod.module_number.replace('M', '')}
                 </div>
              </div>

              {/* Module Title Box */}
              <div className="w-full lg:w-1/2 pr-0 lg:pr-16 pl-20 lg:pl-0 mt-2 lg:mt-0 text-left lg:text-right">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ root: containerRef, once: true, margin: "0px 0px -50px 0px" }}
                  className="glass-panel p-5 rounded-2xl border border-white/10"
                >
                   <h2 className="text-xl font-bold text-white mb-1">{mod.title}</h2>
                   <p className="text-slate-400 text-sm">{mod.topics.length} topics</p>
                </motion.div>
              </div>

              {/* Topics List */}
              <div className="w-full lg:w-1/2 pl-20 lg:pl-16 mt-10 lg:mt-0">
                 <div className="flex flex-col gap-4 relative">
                   {mod.topics.map((topic, j) => {
                     const isDone = completedTopics.includes(topic.title);
                     return (
                       <motion.div 
                         key={j}
                         initial={{ opacity: 0, x: 20 }}
                         whileInView={{ opacity: 1, x: 0 }}
                         viewport={{ root: containerRef, once: true, margin: "0px 0px -20px 0px" }}
                         transition={{ delay: j * 0.1 }}
                         onClick={() => setSelectedTopic(topic)}
                         className={`group relative p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                           isDone 
                             ? "bg-green-500/10 border-green-500/30" 
                             : "bg-white/5 border-white/5 hover:border-indigo-500/50 hover:bg-white/10"
                         }`}
                       >
                          {/* Dot line to main trunk */}
                          <div className="absolute top-1/2 -left-12 w-12 h-0 border-t-2 border-dashed border-indigo-500/30 -translate-y-1/2 group-hover:border-indigo-500/60 transition-colors" />
                          
                          <div className="flex items-center gap-3 pr-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleComplete(topic.title) }}
                              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isDone ? "bg-green-500 border-green-500" : "border-slate-500 hover:border-indigo-400"
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                            <span className={`font-medium text-sm lg:text-base ${isDone ? 'text-slate-400 line-through' : 'text-white'}`}>
                              {topic.title}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                       </motion.div>
                     )
                   })}
                 </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar for Topic Detail */}
      <AnimatePresence>
         {selectedTopic && (
           <motion.div 
             initial={{ x: "100%" }}
             animate={{ x: 0 }}
             exit={{ x: "100%" }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             className="w-full md:w-96 bg-slate-950/90 backdrop-blur-3xl border-l border-white/10 h-screen fixed md:relative right-0 top-0 z-50 p-6 flex flex-col shadow-2xl"
           >
             <button 
               onClick={() => setSelectedTopic(null)}
               className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
             >
               <X className="w-4 h-4" />
             </button>
             <div className="mt-8 flex-1 overflow-y-auto disable-scrollbar pr-2">
               <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Topic Details</span>
               <h3 className="text-2xl font-bold text-white mb-6 pr-8">{selectedTopic.title}</h3>
               
               <div className="space-y-6">
                 <div>
                   <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                     <PlayCircle className="w-4 h-4 text-purple-400" /> Recommended Video
                   </h4>
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 cursor-pointer transition-colors group">
                     <p className="text-sm font-medium group-hover:text-purple-300 transition-colors">Crash Course: {selectedTopic.title}</p>
                     <span className="text-xs text-slate-500 mt-1 block">YouTube • 12 mins</span>
                   </div>
                 </div>

                 <div>
                   <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-emerald-400" /> Reading Material
                   </h4>
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-colors group">
                     <p className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Core Concepts Guide</p>
                     <span className="text-xs text-slate-500 mt-1 block">Article • 5 min read</span>
                   </div>
                 </div>
               </div>
             </div>

             <div className="mt-auto pt-6 pb-20 md:pb-0">
               <button 
                  onClick={() => toggleComplete(selectedTopic.title)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    completedTopics.includes(selectedTopic.title) 
                      ? "bg-white/10 text-white hover:bg-white/20" 
                      : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  }`}
               >
                 {completedTopics.includes(selectedTopic.title) ? "Mark as Incomplete" : "Mark as Complete"}
               </button>
             </div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Floating AI Tutor Bubble */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center text-white z-40 cursor-pointer"
      >
        <Bot className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
