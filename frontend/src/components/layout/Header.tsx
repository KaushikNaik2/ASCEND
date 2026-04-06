import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Network, Trophy, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useStore()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleAuthAction = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className={`z-50 w-full transition-all duration-500 ${isScrolled ? 'fixed top-0 left-0 right-0 pt-4 px-4 pointer-events-none' : 'relative pt-0 px-0 pointer-events-auto'}`}>
      <header className={`mx-auto flex justify-between items-center transition-all duration-500 pointer-events-auto ${isScrolled
        ? 'w-full max-w-6xl px-6 py-3 bg-slate-950/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl'
        : 'w-full p-6 bg-linear-to-b from-slate-950/80 to-transparent border-transparent'
        }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20 flex items-center justify-center">
            <span className="font-bold text-white tracking-widest text-sm">A</span>
          </div>
          <Link to="/" className="font-bold text-xl tracking-tight cursor-pointer">ASCEND</Link>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300 pointer-events-auto">
          <Link to="/roadmaps" className={`hover:text-white transition-colors relative group ${isActive('/roadmaps') ? 'text-white' : ''}`}>
            Roadmaps
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all ${isActive('/roadmaps') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
          <Link to="/generate" className={`hover:text-white transition-colors relative group ${isActive('/generate') ? 'text-white' : ''}`}>
            Generate
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all ${isActive('/generate') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
          <Link to="/graph" className={`hover:text-white transition-colors relative group flex items-center gap-1.5 ${isActive('/graph') ? 'text-white' : ''}`}>
            <Network className="w-3.5 h-3.5" />
            Graph
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-500 transition-all ${isActive('/graph') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
          <Link to="/leaderboard" className={`hover:text-white transition-colors relative group flex items-center gap-1.5 ${isActive('/leaderboard') ? 'text-white' : ''}`}>
            <Trophy className="w-3.5 h-3.5" />
            Leaderboard
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-500 transition-all ${isActive('/leaderboard') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
          <Link to="/guides" className={`hover:text-white transition-colors relative group ${isActive('/guides') ? 'text-white' : ''}`}>
            Guides
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all ${isActive('/guides') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
        </nav>
        <div className="flex gap-3 pointer-events-auto items-center">
          {!isAuthenticated ? (
            <>
              <button
                onClick={handleAuthAction}
                className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/5 transition-colors text-white cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAuthAction}
                className="px-4 py-2 text-sm font-semibold rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white cursor-pointer"
              >
                Dashboard
              </button>
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <User className="w-4 h-4 text-white" />
              </Link>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}
