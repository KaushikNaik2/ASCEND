import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Map, ChevronRight } from 'lucide-react'

const CATEGORIES = ["All", "Science", "Commerce", "Arts", "Engineering", "Medicine"]

const MOCK_ROADMAPS = [
  { id: 1, title: "Computer Science Degree", category: "Engineering", topics: 42, difficulty: "Advanced", color: "from-blue-500 to-indigo-600" },
  { id: 2, title: "Intro to Machine Learning", category: "Science", topics: 24, difficulty: "Intermediate", color: "from-emerald-400 to-teal-600" },
  { id: 3, title: "Calculus I & II", category: "Science", topics: 30, difficulty: "Beginner", color: "from-purple-500 to-fuchsia-600" },
  { id: 4, title: "Corporate Finance", category: "Commerce", topics: 18, difficulty: "Intermediate", color: "from-amber-400 to-orange-600" },
  { id: 5, title: "World History", category: "Arts", topics: 35, difficulty: "Beginner", color: "from-rose-400 to-pink-600" },
  { id: 6, title: "Human Anatomy", category: "Medicine", topics: 50, difficulty: "Advanced", color: "from-red-500 to-rose-600" },
]

export default function BrowseRoadmaps() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRoadmaps = MOCK_ROADMAPS.filter(rm => {
    const matchesCategory = activeCategory === "All" || rm.category === activeCategory
    const matchesSearch = rm.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="w-full min-h-[85vh] p-6 max-w-7xl mx-auto relative z-10 flex flex-col">
      <div className="mb-12 mt-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans tracking-tight">Browse Roadmaps</h1>
        <p className="text-slate-400 text-lg max-w-2xl">Find structured learning paths for any academic subject. From high school basics to university degrees.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search roadmaps..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeCategory === cat 
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
          {filteredRoadmaps.map((rm) => (
            <motion.div
               key={rm.id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               transition={{ duration: 0.2 }}
            >
               <Link 
                 to={`/roadmap/${rm.id}`} 
                 className="group block h-64 rounded-3xl p-px bg-linear-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all cursor-pointer"
               >
                 <div className="w-full h-full rounded-[23px] bg-slate-900 p-6 flex flex-col relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${rm.color} opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity`}></div>
                   
                   <div className="flex-1">
                     <div className="flex justify-between items-start mb-4">
                       <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/5 text-xs font-semibold text-slate-300">
                         {rm.difficulty}
                       </span>
                       <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{rm.category}</span>
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-2 pr-4">{rm.title}</h3>
                     <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Map className="w-4 h-4" />
                        <span>{rm.topics} Topics</span>
                     </div>
                   </div>
     
                   <div className="flex justify-end relative z-10">
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors shadow-lg">
                       <ChevronRight className="w-5 h-5 text-white" />
                     </div>
                   </div>
                 </div>
               </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredRoadmaps.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            <p className="text-xl">No roadmaps found matching your criteria.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
