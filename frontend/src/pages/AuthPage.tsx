import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import AuthForm from '../components/ui/AuthForm'

export default function AuthPage({ type }: { type: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const { setAuthenticated } = useStore()

  const handleSubmit = () => {
    setAuthenticated(true)
    navigate('/dashboard')
  }

  const handleSwitchMode = () => {
    navigate(type === 'login' ? '/signup' : '/login')
  }

  const handleBack = () => {
    navigate('/')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex pointer-events-none"
    >
      <div className="hidden lg:block lg:w-1/2 relative">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full px-12">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-400 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Start Your <br/>Learning Journey</h1>
            <p className="text-xl text-slate-300">Map your syllabus to continuous growth.</p>
         </div>
      </div>
      
      <div className="w-full lg:w-1/2 bg-slate-950/90 backdrop-blur-3xl flex flex-col justify-center px-8 sm:px-16 border-l border-white/10 relative overflow-y-auto pointer-events-auto">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />
         
         <div className="relative z-10 w-full max-w-md mx-auto my-auto py-12">
            <AuthForm 
              type={type} 
              onBack={handleBack}
              onSubmit={handleSubmit}
              onSwitchMode={handleSwitchMode}
            />
         </div>
      </div>
    </motion.div>
  )
}
