import { Link, useNavigate } from 'react-router-dom'

export default function HomePage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative z-10 text-center max-w-md mx-auto animate-fade-in">
                {/* Logo / Title */}
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    Spot the
                    <br />
                    Difference
                </h1>

                <p className="text-slate-400 text-lg mb-10">
                    🎮 เกมจับผิดภาพแบบ Multiplayer
                </p>

                <div className="glass-card space-y-4">
                    <Link
                        to="/admin"
                        className="btn btn-primary w-full text-lg py-4"
                    >
                        🎯 สร้างห้องเกม (Admin)
                    </Link>

                    <div className="flex items-center gap-4 text-slate-500">
                        <div className="flex-1 h-px bg-slate-700"></div>
                        <span className="text-sm">หรือ</span>
                        <div className="flex-1 h-px bg-slate-700"></div>
                    </div>

                    <p className="text-slate-400 text-sm">
                        มี Room Code แล้ว? <br />
                        สแกน QR Code หรือใส่โค้ดด้านล่าง
                    </p>

                    <form
                        className="flex gap-2"
                        onSubmit={async (e) => {
                            e.preventDefault()
                            const form = e.target as HTMLFormElement
                            const codeInput = form.code as HTMLInputElement
                            const baseCode = codeInput.value
                            const code = baseCode ? baseCode.toUpperCase().trim() : ''

                            if (!code) return

                            try {
                                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/rooms/${code}`)
                                if (res.ok) {
                                    navigate(`/join/${code}`)
                                } else {
                                    alert('ไม่พบห้องนี้ในระบบ / Room not found')
                                }
                            } catch (err) {
                                console.error(err)
                                alert('เกิดข้อผิดพลาดในการเชื่อมต่อ / Connection error')
                            }
                        }}

                    >
                        <input
                            type="text"
                            name="code"
                            placeholder="ENTER CODE"
                            maxLength={6}
                            className="input flex-1 text-center uppercase tracking-widest font-mono text-lg"
                        />
                        <button type="submit" className="btn btn-secondary px-6">
                            เข้าร่วม
                        </button>
                    </form>
                </div>

                <p className="text-blue-600 text-xl mt-8">
                    Made with ❤️ for fun  by <span className="text-indigo-400">Watchara@TST-IS 2026</span>
                </p>
            </div>
        </div>
    )
}
