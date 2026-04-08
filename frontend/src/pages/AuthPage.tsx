import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { getUserStatus } from '../lib/api'
import AuthForm from '../components/ui/AuthForm'

export default function AuthPage({ type }: { type: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const { setAuthenticated, setUser } = useStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data?: any) => {
    if (!data?.email || !data?.password) return

    setIsLoading(true)
    setError(null)

    try {
      if (type === 'signup') {
        // ─── NEW USER FLOW ───
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name || '',
              user_type: data.userType || '',
              stream: data.stream || '',
              current_course: data.currentCourse || '',
              university_name: data.universityName || '',
              college_name: data.collegeName || '',
            },
          },
        })

        if (authError) throw authError

        const user = authData.user
        if (user) {
          setUser({ id: user.id, email: user.email! })
          setAuthenticated(true)
          // New user → forced through onboarding
          navigate('/onboarding')
        } else {
          setError('Check your email to confirm your account, then sign in.')
        }
      } else {
        // ─── EXISTING USER FLOW ───
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (authError) throw authError

        const user = authData.user
        if (user) {
          setUser({ id: user.id, email: user.email! })
          setAuthenticated(true)

          // Smart routing: check what state the user is in
          try {
            const status = await getUserStatus(user.id)

            if (status.has_roadmap) {
              // Fully onboarded → straight to dashboard
              navigate('/dashboard')
            } else if (status.has_profile) {
              // Has profile but no roadmap → mode selection
              navigate('/onboarding')
            } else {
              // No profile → onboarding (profile step can be added later)
              navigate('/onboarding')
            }
          } catch {
            // If status check fails, default to onboarding
            navigate('/onboarding')
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchMode = () => {
    setError(null)
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
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-b from-white to-slate-400 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Start Your <br />Learning Journey</h1>
          <p className="text-xl text-slate-300">Map your syllabus to continuous growth.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-slate-950/90 backdrop-blur-3xl flex flex-col justify-center px-8 sm:px-16 border-l border-white/10 relative overflow-y-auto pointer-events-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 w-full max-w-md mx-auto my-auto py-12">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
              {error}
            </div>
          )}
          <AuthForm
            type={type}
            onBack={handleBack}
            onSubmit={handleSubmit}
            onSwitchMode={handleSwitchMode}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
