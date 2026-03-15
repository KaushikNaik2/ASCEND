import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, BrainCircuit, Sparkles, Map } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="w-full relative z-10 flex flex-col pt-10">
      <HeroSection />
      <FeaturedRoadmapsGrid />
      <HowItWorksSection />
      <StatsSection />
      <Footer />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-medium text-sm mb-8 backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>The Next Generation of Academic Learning</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-white via-slate-200 to-slate-400 mb-6 drop-shadow-sm leading-tight">
          Navigate Your Courses with <br className="hidden md:block"/> Interactive Roadmaps
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your syllabus and instantly get an AI-curated, structured learning path. 
          Track progress, access top resources, and master any subject step-by-step.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/generate" 
            className="group px-8 py-4 rounded-full bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center gap-2"
          >
            Upload Syllabus 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/roadmaps" 
            className="px-8 py-4 rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-md text-white font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Browse Roadmaps
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

function FeaturedRoadmapsGrid() {
  const roadmaps = [
    { title: "Computer Science Degree", topics: 42, difficulty: "Advanced", color: "from-blue-500 to-indigo-600" },
    { title: "Intro to Machine Learning", topics: 24, difficulty: "Intermediate", color: "from-emerald-400 to-teal-600" },
    { title: "Calculus I & II", topics: 30, difficulty: "Beginner", color: "from-purple-500 to-fuchsia-600" }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Roadmaps</h2>
          <div className="w-16 h-1 bg-blue-500 rounded-full"></div>
        </div>
        <Link to="/roadmaps" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {roadmaps.map((rm, i) => (
          <Link key={i} to="/roadmap/123" className="group block h-64 rounded-3xl p-1 bg-linear-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all cursor-pointer">
            <div className="w-full h-full rounded-[23px] bg-slate-900 p-6 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${rm.color} opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity`}></div>
              
              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-4 text-slate-300">
                  {rm.difficulty}
                </span>
                <h3 className="text-2xl font-bold text-white mb-2">{rm.title}</h3>
                <p className="text-slate-400 text-sm">{rm.topics} Topics</p>
              </div>

              <div className="flex justify-end">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-400" />,
      title: "1. Upload Your Syllabus",
      description: "Drop your PDF syllabus. Our AI reads the course structure and topics."
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
      title: "2. AI Parses & Structures",
      description: "We automatically create a coherent roadmap and fetch curated learning resources."
    },
    {
      icon: <Map className="w-8 h-8 text-emerald-400" />,
      title: "3. Start Learning",
      description: "Follow the interactive path, mark topics as complete, and track your progress."
    }
  ]

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full"></div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-inner mb-6 relative z-10">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 relative z-10">{step.title}</h3>
            <p className="text-slate-400 leading-relaxed relative z-10">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="py-24 border-t border-white/5 bg-slate-950/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { label: "Active Students", value: "10,000+" },
          { label: "Roadmaps Created", value: "50,000+" },
          { label: "Topics Mastered", value: "2M+" },
          { label: "Curated Resources", value: "150K+" }
        ].map((stat, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-400">
              {stat.value}
            </span>
            <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-8 text-center border-t border-white/5 text-slate-500 text-sm">
      <p>&copy; {new Date().getFullYear()} ASCEND. All rights reserved.</p>
    </footer>
  )
}
