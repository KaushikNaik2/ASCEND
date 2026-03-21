import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, BrainCircuit, TrendingUp, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="w-full relative z-10 flex flex-col">
      <LandingHeader />
      <HeroSection />
      <FeaturedRoadmapsGrid />
      <HowItWorksSection />
      <StatsSection />
      <Footer />
    </div>
  )
}

function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
          A
        </div>
        <span className="font-extrabold text-white text-sm tracking-widest uppercase">ASCEND</span>
      </div>
      <Link
        to="/login"
        className="px-5 py-2 rounded-full border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
      >
        Login
      </Link>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center pt-16">
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

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 drop-shadow-sm leading-tight">
          Navigate Your Courses with <br className="hidden md:block" /> Interactive Roadmaps
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your syllabus and instantly get an AI-curated, structured learning path.
          Track progress, access top resources, and master any subject step-by-step.
        </p>

        {/* Single CTA button per PRD §5.2 */}
        <Link
          to="/signup"
          className="group inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        >
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </section>
  )
}

function FeaturedRoadmapsGrid() {
  const roadmaps = [
    { title: 'Computer Science Degree', topics: 42, difficulty: 'Advanced', color: 'from-blue-500 to-indigo-600' },
    { title: 'Intro to Machine Learning', topics: 24, difficulty: 'Intermediate', color: 'from-emerald-400 to-teal-600' },
    { title: 'Calculus I & II', topics: 30, difficulty: 'Beginner', color: 'from-purple-500 to-fuchsia-600' },
  ]

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Roadmaps</h2>
          <div className="w-16 h-1 bg-blue-500 rounded-full" />
        </div>
        <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {roadmaps.map((rm, i) => (
          <Link key={i} to="/signup" className="group block h-64 rounded-3xl p-1 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all">
            <div className="w-full h-full rounded-[23px] bg-slate-900 p-6 flex flex-col relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${rm.color} opacity-20 blur-3xl rounded-full group-hover:opacity-40 transition-opacity`} />
              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-4 text-slate-300">{rm.difficulty}</span>
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
  // Updated steps per PRD §5.3
  const steps = [
    {
      icon: <ClipboardCheck className="w-8 h-8 text-indigo-400" />,
      title: 'Diagnostic Test',
      description: 'We assess your existing knowledge before building your path.',
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
      title: 'AI Powered Learning Path',
      description: 'Our AI generates a personalized roadmap tailored to your syllabus and skill gaps.',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
      title: 'Progress Tracking',
      description: 'Track every topic, streak, and milestone as you advance.',
    },
  ]

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <div className="w-24 h-1 bg-indigo-500 mx-auto rounded-full" />
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
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
          { label: 'Active Students', value: '10,000+' },
          { label: 'Roadmaps Created', value: '50,000+' },
          { label: 'Topics Mastered', value: '2M+' },
          { label: 'Curated Resources', value: '150K+' },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              {stat.value}
            </span>
            <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">{stat.label}</span>
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
