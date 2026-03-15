import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'

export default function Header() {
  const navigate = useNavigate()
  const { isAuthenticated } = useStore()

  const handleAuthAction = () => {
     if (isAuthenticated) {
        navigate('/dashboard')
     } else {
        navigate('/login')
     }
  }

  return (
    <header className="w-full p-6 flex justify-between items-center bg-linear-to-b from-slate-950/80 to-transparent pointer-events-auto">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20 flex items-center justify-center">
          <span className="font-bold text-white tracking-widest text-sm">A</span>
        </div>
        <Link to="/" className="font-bold text-xl tracking-tight cursor-pointer">ASCEND</Link>
      </div>
      <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300 pointer-events-auto">
        <Link to="/roadmaps" className="hover:text-white transition-colors relative group">
          Roadmaps
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
        </Link>
        <Link to="/generate" className="hover:text-white transition-colors relative group">
          Generate
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
        </Link>
        <Link to="/guides" className="hover:text-white transition-colors relative group">
          Guides
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full"></span>
        </Link>
      </nav>
      <div className="flex gap-3 pointer-events-auto">
        {!isAuthenticated ? (
          <>
            <button 
              onClick={handleAuthAction}
              className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/5 transition-colors text-white cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-slate-950 hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 cursor-pointer"
            >
              Get Started
            </button>
          </>
        ) : (
          <button 
            onClick={handleAuthAction}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white cursor-pointer"
          >
            Dashboard
          </button>
        )}
      </div>
    </header>
  )
}
