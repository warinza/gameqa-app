import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

interface Player {
    id: string
    nickname: string
    avatar: string
    score: number
    isOnline: boolean
    isPreloaded?: boolean
}

interface ImageData {
    id: string
    original_url: string
    modified_url: string
}

interface RoomState {
    players: Player[]
    status: string
    imageQueue?: ImageData[]
}

export default function LobbyPage() {
    const { roomCode } = useParams()
    const navigate = useNavigate()
    const [socket, setSocket] = useState<Socket | null>(null)
    const [roomState, setRoomState] = useState<RoomState>({ players: [], status: 'LOBBY' })
    const [isAdmin, setIsAdmin] = useState(false)

    // Preload states
    const [preloadProgress, setPreloadProgress] = useState({ loaded: 0, total: 0 })
    const [isPreloadComplete, setIsPreloadComplete] = useState(false)
    const [playersPreloadStatus, setPlayersPreloadStatus] = useState<{ id: string, nickname: string, isPreloaded: boolean }[]>([])
    const preloadStarted = useRef(false)
    const playerIdRef = useRef<string>('')

    // Preload single image
    const loadImage = (src: string): Promise<void> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = () => resolve() // Continue even if one image fails
            img.src = src
        })
    }

    // Preload all images
    const preloadImages = useCallback(async (imageQueue: ImageData[], socket: Socket) => {
        if (preloadStarted.current || !imageQueue || imageQueue.length === 0) return
        preloadStarted.current = true

        const urls = imageQueue.flatMap(img => [img.original_url, img.modified_url].filter(Boolean))
        setPreloadProgress({ loaded: 0, total: urls.length })

        for (let i = 0; i < urls.length; i++) {
            await loadImage(urls[i])
            setPreloadProgress({ loaded: i + 1, total: urls.length })
        }

        setIsPreloadComplete(true)

        // Notify server that preload is complete
        socket.emit('player_preload_complete', { roomCode, playerId: playerIdRef.current })
    }, [roomCode])

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
        playerIdRef.current = playerInfo.id

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

            // Start preloading images when we receive the image queue
            if (state.imageQueue && state.imageQueue.length > 0 && !preloadStarted.current) {
                preloadImages(state.imageQueue, newSocket)
            }
        })

        // Listen for preload status updates
        newSocket.on('preload_status_update', (data: { players: { id: string, nickname: string, isPreloaded: boolean }[] }) => {
            setPlayersPreloadStatus(data.players)
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
    }, [roomCode, navigate, preloadImages])

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

    // Calculate preload status
    const preloadedCount = playersPreloadStatus.filter(p => p.isPreloaded).length
    const totalPlayers = playersPreloadStatus.length
    const allPlayersPreloaded = totalPlayers > 0 && preloadedCount === totalPlayers

    return (
        <div className="min-h-screen flex flex-col p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Lobby</h1>
                <p className="text-slate-400">
                    Room: <span className="font-mono text-indigo-400 text-xl">{roomCode}</span>
                </p>
            </header>

            {/* Preload Progress */}
            {preloadProgress.total > 0 && (
                <div className="max-w-md mx-auto w-full mb-6">
                    <div className="glass-card">
                        <div className="flex items-center gap-3 mb-3">
                            {isPreloadComplete ? (
                                <span className="text-2xl">✅</span>
                            ) : (
                                <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                    {isPreloadComplete ? 'โหลดรูปภาพเสร็จแล้ว!' : 'กำลังโหลดรูปภาพ...'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {preloadProgress.loaded} / {preloadProgress.total} รูป
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300 ease-out"
                                style={{ width: `${(preloadProgress.loaded / preloadProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

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
                            roomState.players.map((player, index) => {
                                const playerPreload = playersPreloadStatus.find(p => p.id === player.id)
                                return (
                                    <div
                                        key={player.id}
                                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg animate-fade-in"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <span className="text-2xl">{player.avatar}</span>
                                        <span className="flex-1 font-medium text-white">{player.nickname}</span>
                                        {/* Preload status icon */}
                                        {playerPreload?.isPreloaded ? (
                                            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">✓ พร้อม</span>
                                        ) : (
                                            <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full animate-pulse">⏳ โหลด</span>
                                        )}
                                        {/* Online status */}
                                        {player.isOnline ? (
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        ) : (
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                    </div>
                                )
                            })
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

                        {/* Warning if not all players preloaded */}
                        {!allPlayersPreloaded && totalPlayers > 0 && (
                            <p className="text-center text-amber-400 text-xs mt-2 animate-pulse">
                                ⚠️ มีผู้เล่น {totalPlayers - preloadedCount} คน ยังโหลดไม่เสร็จ
                            </p>
                        )}

                        <button
                            onClick={handleCloseRoom}
                            className="btn btn-secondary w-full mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                            🚫 ปิดห้อง
                        </button>
                        <p className="text-center text-slate-500 text-sm mt-2">
                            {roomState.players.length < 1
                                ? 'รอผู้เล่นอย่างน้อย 1 คน'
                                : allPlayersPreloaded
                                    ? '✅ ทุกคนพร้อมเริ่มเกมแล้ว!'
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
