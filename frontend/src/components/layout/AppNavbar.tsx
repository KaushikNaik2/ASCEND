import { Link, useLocation } from 'react-router-dom'
import { Home, Map, HelpCircle, BarChart2, UserCircle, Lock } from 'lucide-react'

interface AppNavbarProps {
    /** When true, all nav icons except Profile show a lock badge (Upload Curriculum page) */
    locked?: boolean
}

const navItems = [
    { path: '/home', icon: Home, label: 'HOME' },
    { path: '/roadmap', icon: Map, label: 'ROADMAP' },
    { path: '/quiz', icon: HelpCircle, label: 'QUIZ' },
    { path: '/dashboard', icon: BarChart2, label: 'DASHBOARD' },
]

export default function AppNavbar({ locked = false }: AppNavbarProps) {
    const location = useLocation()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-slate-950/90 backdrop-blur-xl border-b border-white/10">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-sm shadow-lg">
                    A
                </div>
                <span className="font-extrabold text-white text-sm tracking-widest uppercase hidden sm:block">
                    ASCEND
                </span>
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
                {navItems.map(({ path, icon: Icon, label }) => {
                    const isActive = location.pathname === path
                    const isLocked = locked && path !== '/profile'

                    return (
                        <div key={path} className="relative">
                            <Link
                                to={isLocked ? '#' : path}
                                onClick={isLocked ? (e) => e.preventDefault() : undefined}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${isActive
                                        ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.4)]'
                                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                                    } ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {isActive && (
                                    <span className="hidden sm:inline">{label}</span>
                                )}
                            </Link>
                            {/* Lock badge */}
                            {isLocked && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-slate-700 rounded-full flex items-center justify-center">
                                    <Lock className="w-2.5 h-2.5 text-slate-400" />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Profile Avatar */}
            <Link to="/profile" className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800 border border-white/10 hover:bg-slate-700 transition-colors shrink-0">
                <UserCircle className="w-5 h-5 text-slate-400" />
            </Link>
        </nav>
    )
}
