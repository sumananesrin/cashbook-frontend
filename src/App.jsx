import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import LoginPage from './pages/LoginPage'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import './App.css'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return <div>Loading...</div>
  return user ? <Outlet /> : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="cashbooks" element={<div className="content-area"><h1>Cashbooks</h1><p>Coming soon...</p></div>} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/:id" element={<ReportDetail />} />
              <Route path="team" element={<div className="content-area"><h1>Team</h1><p>Coming soon...</p></div>} />
              <Route path="settings" element={<div className="content-area"><h1>Settings</h1><p>Coming soon...</p></div>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

