import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface ScoreEntry {
    id: string
    nickname: string
    avatar: string
    score: number
}

export default function ResultPage() {
    const { roomCode } = useParams()
    const [scores, setScores] = useState<ScoreEntry[]>([])

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchFinalScores() {
            if (!roomCode) return

            try {
                // 1. Get room ID from code
                const { data: roomData, error: roomError } = await supabase
                    .from('rooms')
                    .select('id')
                    .eq('code', roomCode)
                    .single()

                if (roomError) throw roomError
                if (!roomData) throw new Error('Room not found')

                // 2. Fetch players using room_id
                const { data, error } = await supabase
                    .from('players')
                    .select('*')
                    .eq('room_id', roomData.id)
                    .order('score', { ascending: false })

                if (error) throw error
                if (data) {
                    // Map avatar_id to avatar for the UI AND Filter out Admin
                    const mappedData = data
                        .filter(p => p.nickname !== 'Admin')
                        .map(p => ({
                            ...p,
                            avatar: p.avatar_id
                        }))
                    setScores(mappedData)
                }
            } catch (err) {
                console.error('Error fetching scores:', err)
                // Fallback to session storage if DB fails
                const result = sessionStorage.getItem('gameResult')
                if (result) {
                    setScores(JSON.parse(result))
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchFinalScores()
    }, [roomCode])

    const getRankClass = (index: number) => {
        if (index === 0) return 'rank-1'
        if (index === 1) return 'rank-2'
        if (index === 2) return 'rank-3'
        return ''
    }

    const getMedal = (index: number) => {
        if (index === 0) return '🥇'
        if (index === 1) return '🥈'
        if (index === 2) return '🥉'
        return `#${index + 1}`
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Confetti Animation Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-3 h-3 rounded-sm"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-10%`,
                            backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96f'][i % 5],
                            animation: `confetti ${2 + Math.random() * 2}s linear infinite`,
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 animate-scale-in">
                    <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                        🎉 จบเกม!
                    </h1>
                    <p className="text-slate-400">
                        Room: <span className="font-mono text-indigo-400">{roomCode}</span>
                    </p>
                </div>

                {/* Winner Spotlight */}
                {scores.length > 0 && (
                    <div className="glass-card mb-6 text-center animate-fade-in">
                        <div className="text-6xl mb-2">{scores[0].avatar}</div>
                        <div className="text-2xl font-bold text-white mb-1">{scores[0].nickname}</div>
                        <div className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            🏆 {scores[0].score} คะแนน
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="glass-card">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>📊</span> อันดับคะแนน
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {scores.length > 0 ? scores.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`leaderboard-item ${getRankClass(index)} animate-fade-in`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <span className="text-2xl w-10 text-center">{getMedal(index)}</span>
                                    <span className="text-2xl">{player.avatar}</span>
                                    <span className="flex-1 font-medium text-white">{player.nickname}</span>
                                    <span className="score-badge">{player.score}</span>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500">
                                    ไม่พบข้อมูลคะแนน
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <Link
                        to="/"
                        className="btn btn-secondary flex-1"
                    >
                        🏠 กลับหน้าหลัก
                    </Link>
                    <Link
                        to={`/lobby/${roomCode}`}
                        className="btn btn-primary flex-1"
                    >
                        🔄 เล่นอีกครั้ง
                    </Link>
                </div>
            </div>
        </div>
    )
}
