import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import HomePage from './pages/HomePage'
import JoinPage from './pages/JoinPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import ResultPage from './pages/ResultPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCreateRoom from './pages/admin/AdminCreateRoom'
import AdminEditImage from './pages/admin/AdminEditImage'
import AdminLogin from './pages/admin/AdminLogin'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = sessionStorage.getItem('adminToken') === 'authenticated'
    return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />
}

function App() {
    return (
        <ToastProvider>
            <Routes>
                {/* Player Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/join/:roomCode" element={<JoinPage />} />
                <Route path="/lobby/:roomCode" element={<LobbyPage />} />
                <Route path="/game/:roomCode" element={<GamePage />} />
                <Route path="/result/:roomCode" element={<ResultPage />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/create-room" element={<ProtectedRoute><AdminCreateRoom /></ProtectedRoute>} />
                <Route path="/admin/edit-image/:imageId" element={<ProtectedRoute><AdminEditImage /></ProtectedRoute>} />
            </Routes>
        </ToastProvider>
    )
}

export default App
