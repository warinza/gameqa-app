import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toast'

export default function AdminLogin() {
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const toast = useToast()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (password === 'WatcharaKrub') {
            sessionStorage.setItem('adminToken', 'authenticated')
            toast.success('เข้าสู่ระบบสำเร็จ')
            navigate('/admin')
        } else {
            toast.error('รหัสผ่านไม่ถูกต้อง')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="glass-card w-full max-w-sm animate-scale-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin Access</h1>
                    <p className="text-slate-400 text-sm">โปรดระบุรหัสผ่านเพื่อดำเนินการต่อ</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ADMIN PASSWORD"
                        className="input text-center tracking-[0.5em] font-mono"
                        autoFocus
                    />
                    <button type="submit" className="btn btn-primary w-full py-4 text-lg">
                        เข้าสู่ระบบ
                    </button>
                </form>

                <p className="text-slate-600 text-[10px] text-center mt-8 uppercase tracking-widest font-black">
                    Secured Area
                </p>
            </div>
        </div>
    )
}
