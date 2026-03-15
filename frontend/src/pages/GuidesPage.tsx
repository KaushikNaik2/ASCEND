import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, PlayCircle, FileText, BookOpen, Link as LinkIcon, ExternalLink } from 'lucide-react'

const MOCK_GUIDES = [
  { id: 1, title: "Crash Course: Neural Networks", subject: "AI & ML", type: "Video", time: "15 mins", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 2, title: "Understanding the Multi-Armed Bandit", subject: "Algorithm Design", type: "Article", time: "8 mins", icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 3, title: "Introduction to Calculus Limits", subject: "Mathematics", type: "Video", time: "22 mins", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 4, title: "Quantum Supremacy Explained", subject: "Physics", type: "Paper", time: "30 mins", icon: <BookOpen className="w-5 h-5 text-blue-400" /> },
  { id: 5, title: "The History of Rome: An Overview", subject: "History", type: "Article", time: "12 mins", icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 6, title: "Advanced CSS Layouts guide", subject: "Web Dev", type: "Website", time: "10 mins", icon: <LinkIcon className="w-5 h-5 text-indigo-400" /> },
]

const TYPES = ["All", "Video", "Article", "Paper", "Website"]

export default function GuidesPage() {
  const [activeType, setActiveType] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGuides = MOCK_GUIDES.filter(g => {
    const matchesCategory = activeType === "All" || g.type === activeType
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.subject.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="w-full min-h-[85vh] p-6 max-w-7xl mx-auto relative z-10 flex flex-col mt-4">
      <div className="mb-12 mt-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans tracking-tight">Resource Library</h1>
        <p className="text-slate-400 text-lg max-w-2xl">Curated guides, videos, and articles to help you master any subject faster.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search guides..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          {TYPES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveType(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all cursor-pointer ${
                activeType === cat 
                  ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredGuides.map((g) => (
            <motion.div
               key={g.id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               transition={{ duration: 0.2 }}
               className="group relative h-full"
            >
               <a 
                 href="#"
                 className="block h-full rounded-3xl p-px bg-linear-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all cursor-pointer"
               >
                 <div className="w-full h-full min-h-[220px] rounded-[23px] bg-slate-900 p-6 flex flex-col relative overflow-hidden">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-semibold text-slate-300">
                        {g.icon}
                        <span>{g.type}</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400">
                        {g.time}
                      </span>
                   </div>
                   
                   <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors pr-4 leading-snug">{g.title}</h3>
                   <span className="text-sm font-medium text-slate-500 mb-6 block">{g.subject}</span>
     
                   <div className="mt-auto flex justify-between items-center relative z-10 pt-4">
                     <span className="text-slate-400 group-hover:text-indigo-400 text-sm font-medium transition-colors">Read now</span>
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg">
                       <ExternalLink className="w-4 h-4 text-white" />
                     </div>
                   </div>
                 </div>
               </a>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredGuides.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            <p className="text-xl">No resources found matching your search.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
