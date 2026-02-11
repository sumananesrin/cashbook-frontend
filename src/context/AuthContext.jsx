import { createContext, useState, useEffect, useContext } from 'react'
import api from '../api/axios'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/auth/me/')
            setUser(response.data)
        } catch (error) {
            console.error("Failed to fetch user", error)
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [])

    const login = async (username, password) => {
        try {
            const response = await api.post('/api/auth/login/', {
                username,
                password
            })
            const { access, refresh, user: userData } = response.data
            localStorage.setItem('access_token', access)
            localStorage.setItem('refresh_token', refresh)
            setUser(userData)
            return { success: true }
        } catch (error) {
            console.error('Login failed', error)
            return {
                success: false,
                error: error.response?.data?.detail || 'Invalid username or password'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        window.location.href = '/login'
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

