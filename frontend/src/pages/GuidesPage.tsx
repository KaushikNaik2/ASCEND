import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, PlayCircle, FileText, BookOpen, Link as LinkIcon, ExternalLink, Sparkles } from 'lucide-react'

const MOCK_GUIDES = [
  { id: 1, title: "Crash Course: Neural Networks", subject: "AI & ML", type: "Video", time: "15 mins", url: "https://www.youtube.com/watch?v=aircAruvnKk", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 2, title: "Understanding the Multi-Armed Bandit", subject: "Algorithm Design", type: "Article", time: "8 mins", url: "https://www.geeksforgeeks.org/multi-armed-bandit-problem-in-reinforcement-learning/", icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 3, title: "Introduction to Calculus Limits", subject: "Mathematics", type: "Video", time: "22 mins", url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new/ab-1-2/v/introduction-to-limits-hd", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 4, title: "Quantum Supremacy Explained", subject: "Physics", type: "Paper", time: "30 mins", url: "https://arxiv.org/abs/1911.06842", icon: <BookOpen className="w-5 h-5 text-blue-400" /> },
  { id: 5, title: "The History of Rome: An Overview", subject: "History", type: "Article", time: "12 mins", url: "https://en.wikipedia.org/wiki/Roman_Empire", icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 6, title: "Advanced CSS Layouts Guide", subject: "Web Dev", type: "Website", time: "10 mins", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout", icon: <LinkIcon className="w-5 h-5 text-indigo-400" /> },
  { id: 7, title: "Python for Data Science – Full Course", subject: "Data Science", type: "Video", time: "45 mins", url: "https://www.youtube.com/watch?v=LHBE6Q9XlzI", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 8, title: "Git & GitHub Crash Course", subject: "DevOps", type: "Video", time: "30 mins", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 9, title: "JavaScript Promises & Async", subject: "Web Dev", type: "Article", time: "15 mins", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS/Promises", icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 10, title: "Linear Algebra – Essence of It", subject: "Mathematics", type: "Video", time: "18 mins", url: "https://www.youtube.com/watch?v=fNk_zzaMoSs", icon: <PlayCircle className="w-5 h-5 text-purple-400" /> },
  { id: 11, title: "Introduction to Algorithms (MIT OCW)", subject: "Computer Science", type: "Website", time: "60 mins", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/", icon: <LinkIcon className="w-5 h-5 text-indigo-400" /> },
  { id: 12, title: "The Science of Well-Being (Yale)", subject: "Psychology", type: "Website", time: "40 mins", url: "https://www.coursera.org/learn/the-science-of-well-being", icon: <LinkIcon className="w-5 h-5 text-indigo-400" /> },
]

const TYPES = ["All", "Video", "Article", "Paper", "Website"]

const cardGradients = [
  'from-indigo-500/10 via-transparent to-transparent',
  'from-purple-500/10 via-transparent to-transparent',
  'from-blue-500/10 via-transparent to-transparent',
  'from-emerald-500/10 via-transparent to-transparent',
  'from-amber-500/10 via-transparent to-transparent',
  'from-pink-500/10 via-transparent to-transparent',
]

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
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 mt-8 text-center md:text-left"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Free curated resources</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">Resource Library</h1>
        <p className="text-slate-400 text-lg max-w-2xl">Curated guides, videos, and articles to help you master any subject faster.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between"
      >
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/30 transition-all duration-300"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          {TYPES.map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveType(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 cursor-pointer ${activeType === cat
                  ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 hover:border-white/20"
                }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredGuides.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="group relative h-full"
            >
              <a
                href={g.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full rounded-3xl p-px bg-gradient-to-br from-white/10 to-white/5 hover:from-indigo-500/30 hover:to-purple-500/10 transition-all duration-500 cursor-pointer"
              >
                <div className={`w-full h-full min-h-[220px] rounded-[23px] bg-slate-900 p-6 flex flex-col relative overflow-hidden`}>
                  {/* Animated glow on hover */}
                  <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${cardGradients[i % cardGradients.length]} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700`} />

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-semibold text-slate-300 group-hover:border-white/15 transition-colors duration-300">
                      {g.icon}
                      <span>{g.type}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors duration-300">
                      {g.time}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors duration-300 pr-4 leading-snug relative z-10">{g.title}</h3>
                  <span className="text-sm font-medium text-slate-500 mb-6 block relative z-10 group-hover:text-slate-400 transition-colors">{g.subject}</span>

                  <div className="mt-auto flex justify-between items-center relative z-10 pt-4">
                    <span className="text-slate-400 group-hover:text-indigo-400 text-sm font-medium transition-colors duration-300">Read now</span>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -10 }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-all duration-300 shadow-lg group-hover:shadow-indigo-500/30"
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                    </motion.div>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredGuides.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center text-slate-500"
          >
            <p className="text-xl">No resources found matching your search.</p>
            <p className="text-sm mt-2">Try a different keyword or category</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
