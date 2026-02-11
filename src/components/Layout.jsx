import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard,
    BookOpen,
    Receipt,
    BarChart3,
    Users,
    Settings,
    ChevronDown,
    LogOut,
    Menu,
    X
} from 'lucide-react'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768)
    const { user, logout } = useAuth()

    // Get user initials
    const getInitials = (name) => {
        if (!name) return 'U'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const displayName = user?.full_name || user?.name || user?.email || 'User'
    const userInitials = getInitials(displayName)

    return (
        <div className="app-layout">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="mobile-overlay"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 150,
                        display: window.innerWidth <= 768 ? 'block' : 'none'
                    }}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <a href="/" className="sidebar-logo">
                        <BookOpen className="sidebar-logo-icon" />
                        <span className="sidebar-logo-text">Cash Book</span>
                    </a>
                    {/* Mobile Close Button */}
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setSidebarOpen(false)}
                        style={{
                            marginLeft: 'auto',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: window.innerWidth <= 768 ? 'flex' : 'none'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <LayoutDashboard />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/cashbooks"
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <BookOpen />
                        <span>Cashbooks</span>
                    </NavLink>

                    <NavLink
                        to="/transactions"
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Receipt />
                        <span>Transactions</span>
                    </NavLink>

                    <NavLink
                        to="/reports"
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <BarChart3 />
                        <span>Reports</span>
                    </NavLink>

                    <NavLink
                        to="/team"
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Users />
                        <span>Team</span>
                    </NavLink>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Settings />
                        <span>Settings</span>
                    </NavLink>

                    <button
                        onClick={logout}
                        className="sidebar-nav-item"
                        style={{ marginTop: 'auto', border: 'none', background: 'none', width: '100%' }}
                    >
                        <LogOut />
                        <span>Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Container */}
            <div className={`main-container ${!sidebarOpen ? 'expanded' : ''}`}>
                {/* Top Bar */}
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button
                            className="menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {/* Show Menu icon when sidebar is closed (collapsed), X when open on mobile */}
                            {sidebarOpen && window.innerWidth <= 768 ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    <div className="user-menu">
                        <div className="user-avatar">{userInitials}</div>
                        <span>{displayName}</span>
                        <ChevronDown size={16} />
                    </div>
                </header>

                {/* Content Area */}
                <Outlet />
            </div>
        </div>
    )
}
