import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

interface Player {
    id: string
    nickname: string
    avatar: string
    score: number
    isOnline: boolean
}

interface RoomState {
    players: Player[]
    status: string
}

export default function LobbyPage() {
    const { roomCode } = useParams()
    const navigate = useNavigate()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [roomState, setRoomState] = useState<RoomState>({ players: [], status: 'LOBBY' })
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        // Connect to socket
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001')
        setSocket(newSocket)

        // Get player info from session
        const playerInfoStr = sessionStorage.getItem('playerInfo')
        if (!playerInfoStr) {
            navigate(`/join/${roomCode}`)
            return
        }

        const playerInfo = JSON.parse(playerInfoStr)

        // Check if admin (from sessionStorage)
        const adminRoom = sessionStorage.getItem('adminRoom')
        setIsAdmin(adminRoom === roomCode)

        // Join room
        newSocket.emit('join_room', {
            roomCode,
            playerId: playerInfo.id,
            nickname: playerInfo.nickname,
            avatar: playerInfo.avatar
        })

        // Listen for room state updates
        newSocket.on('room_state', (state: RoomState) => {
            setRoomState(state)
        })

        // Listen for game start
        newSocket.on('game_start', () => {
            navigate(`/game/${roomCode}`)
        })

        newSocket.on('room_closed', () => {
            navigate('/')
        })

        return () => {
            newSocket.disconnect()
        }
    }, [roomCode, navigate])

    const handleStartGame = () => {
        if (socket && isAdmin) {
            socket.emit('admin_start_match', { roomCode })
        }
    }

    const handleCloseRoom = () => {
        if (socket && isAdmin) {
            socket.emit('admin_close_room', { roomCode })
        }
    }

    return (
        <div className="min-h-screen flex flex-col p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Lobby</h1>
                <p className="text-slate-400">
                    Room: <span className="font-mono text-indigo-400 text-xl">{roomCode}</span>
                </p>
            </header>

            {/* Players List */}
            <div className="flex-1 max-w-md mx-auto w-full">
                <div className="glass-card">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>👥</span>
                        ผู้เล่น ({roomState.players.length})
                    </h2>

                    <div className="space-y-3">
                        {roomState.players.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <div className="text-4xl mb-2">⏳</div>
                                <p>กำลังรอผู้เล่น...</p>
                            </div>
                        ) : (
                            roomState.players.map((player, index) => (
                                <div
                                    key={player.id}
                                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg animate-fade-in"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <span className="text-2xl">{player.avatar}</span>
                                    <span className="flex-1 font-medium text-white">{player.nickname}</span>
                                    {player.isOnline ? (
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    ) : (
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Admin Controls */}
                {isAdmin && (
                    <div className="mt-6">
                        <button
                            onClick={handleStartGame}
                            disabled={roomState.players.length < 1}
                            className="btn btn-success w-full text-lg py-4 disabled:opacity-50"
                        >
                            🚀 เริ่มเกม
                        </button>
                        <button
                            onClick={handleCloseRoom}
                            className="btn btn-secondary w-full mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                            🚫 ปิดห้อง
                        </button>
                        <p className="text-center text-slate-500 text-sm mt-2">
                            {roomState.players.length < 1
                                ? 'รอผู้เล่นอย่างน้อย 1 คน'
                                : 'พร้อมเริ่มเกมแล้ว!'}
                        </p>
                    </div>
                )}

                {/* Player Waiting Message */}
                {!isAdmin && (
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full text-slate-400">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            รอ Admin เริ่มเกม...
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
