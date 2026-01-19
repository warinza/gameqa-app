import { useState, useEffect, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface AdminLayoutProps {
    children: ReactNode
    title: string
    subtitle?: string
    actions?: ReactNode
}

export default function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
    const location = useLocation()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebar_collapsed')
        return saved === 'true'
    })
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed))
    }, [sidebarCollapsed])

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    const navItems = [
        { path: '/admin', icon: '🖼️', label: 'Master Images' },
        { path: '/admin/create-room', icon: '🎮', label: 'Create Room' },
    ]

    const isActivePath = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin' || location.pathname.startsWith('/admin/edit-image')
        }
        return location.pathname === path
    }

    const handleLogout = () => {
        sessionStorage.removeItem('adminToken')
        sessionStorage.removeItem('adminRoom')
        window.location.href = '/'
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-slate-900/80 backdrop-blur-lg border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <span className="font-bold text-lg tracking-tight text-white">GameQA</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLogout}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 active:scale-95 transition-all border border-red-500/20"
                        title="Logout"
                    >
                        🚪
                    </button>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 active:scale-95 transition-all"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay (Mobile only) */}
            {mobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 bottom-0 left-0 z-50 
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                bg-slate-900/50 backdrop-blur-2xl border-r border-white/5
                flex flex-col
                ${sidebarCollapsed ? 'w-20' : 'w-[280px]'}
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:sticky'}
            `}>
                {/* Logo Area */}
                <div className={`p-6 mb-2 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-500 ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                            <span className="text-xl">🎯</span>
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-white whitespace-nowrap">
                            GameQA <span className="text-indigo-400">Admin</span>
                        </span>
                    </div>
                    {sidebarCollapsed && (
                        <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                            <span className="text-xl">🎯</span>
                        </div>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {navItems.map(item => {
                        const active = isActivePath(item.path)
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={sidebarCollapsed ? item.label : ''}
                                className={`
                                    flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group
                                    ${active
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }
                                    ${sidebarCollapsed ? 'justify-center px-0' : ''}
                                `}
                            >
                                <span className={`text-xl transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${active ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </span>
                                {!sidebarCollapsed && (
                                    <span className="font-semibold tracking-wide whitespace-nowrap opacity-100 transition-opacity duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar Footer / Toggle & Logout */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 p-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group
                            ${sidebarCollapsed ? 'justify-center px-0' : ''}
                        `}
                        title={sidebarCollapsed ? "Logout" : ""}
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
                        {!sidebarCollapsed && <span className="font-semibold whitespace-nowrap">Logout</span>}
                    </button>

                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`
                            w-full flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all
                            ${sidebarCollapsed ? 'justify-center px-0' : ''}
                        `}
                    >
                        <span className="text-xl transition-transform duration-500" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>⇠</span>
                        {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">Collapse Menu</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <main className="flex-1 p-6 md:p-10 lg:p-12 w-full mx-auto max-w-[1600px]">
                    {/* Page Header Component */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-fade-in pt-16 md:pt-0">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-lg text-slate-400 font-medium">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex items-center gap-4 flex-wrap">
                                {actions}
                            </div>
                        )}
                    </div>

                    <div className="animate-fade-in delay-100">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
