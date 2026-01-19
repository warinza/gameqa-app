import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const AVATARS = ['🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🦄']

export default function JoinPage() {
    const { roomCode } = useParams()
    const navigate = useNavigate()
    const [nickname, setNickname] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
    const [isJoining, setIsJoining] = useState(false)

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nickname.trim()) return

        setIsJoining(true)

        // Store player info in sessionStorage for use in Lobby
        sessionStorage.setItem('playerInfo', JSON.stringify({
            id: crypto.randomUUID(), // Stable ID for this session
            nickname: nickname.trim(),
            avatar: selectedAvatar,
            roomCode
        }))

        navigate(`/lobby/${roomCode}`)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            </div>

            <div className="relative z-10 w-full max-w-md animate-scale-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
                        Spot the Difference
                    </h1>
                    <p className="text-slate-400">
                        Room: <span className="font-mono text-indigo-400">{roomCode}</span>
                    </p>
                </div>

                {/* Join Form */}
                <form onSubmit={handleJoin} className="glass-card space-y-6">
                    {/* Nickname Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            ชื่อของคุณ
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="กรอกชื่อเล่น..."
                            maxLength={20}
                            className="input"
                            required
                        />
                    </div>

                    {/* Avatar Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            เลือก Avatar
                        </label>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {AVATARS.map((avatar) => (
                                <button
                                    key={avatar}
                                    type="button"
                                    onClick={() => setSelectedAvatar(avatar)}
                                    className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                                >
                                    {avatar}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Join Button */}
                    <button
                        type="submit"
                        disabled={!nickname.trim() || isJoining}
                        className="btn btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isJoining ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                กำลังเข้าร่วม...
                            </span>
                        ) : (
                            '🎮 เข้าร่วมเกม'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
