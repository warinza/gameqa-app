import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import Phaser from 'phaser'

interface ScoreEntry {
    id: string
    nickname: string
    avatar: string
    score: number
}

interface DiffFound {
    playerId: string
    playerName: string
    diffId: string
    newScore: number
    allScores: ScoreEntry[]
}

interface ImageData {
    id: string
    original_url: string
    modified_url: string
    differences: { id: string; x: number; y: number; radius: number }[]
}

interface RoomState {
    players: ScoreEntry[]
    status: string
    imageQueue: ImageData[]
    currentImageIdx: number
}

export default function GamePage() {
    const { roomCode } = useParams()
    const navigate = useNavigate()
    const gameContainer = useRef<HTMLDivElement>(null)
    const [socket, setSocket] = useState<Socket | null>(null)
    const [timer, setTimer] = useState(60)
    const [scores, setScores] = useState<ScoreEntry[]>([])
    const [currentImageIdx, setCurrentImageIdx] = useState(0)
    const [totalImages, setTotalImages] = useState(0)
    const [gameState, setGameState] = useState<'LOBBY' | 'PLAYING' | 'FINISHED'>('LOBBY')
    const phaserGame = useRef<Phaser.Game | null>(null)
    const sceneReady = useRef(false)
    const pendingImage = useRef<ImageData | null>(null)
    const [foundCount, setFoundCount] = useState(0)
    const [totalPoints, setTotalPoints] = useState(0)
    const [missCount, setMissCount] = useState(0)
    const [lockoutTimer, setLockoutTimer] = useState(0)
    const lockoutRef = useRef(0)

    useEffect(() => {
        lockoutRef.current = lockoutTimer
    }, [lockoutTimer])

    useEffect(() => {
        const playerInfoStr = sessionStorage.getItem('playerInfo')
        if (!playerInfoStr) {
            navigate(`/join/${roomCode}`)
            return
        }
        const playerInfo = JSON.parse(playerInfoStr)

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001')
        setSocket(newSocket)

        newSocket.on('connect', () => {
            newSocket.emit('join_room', {
                roomCode,
                playerId: playerInfo.id,
                nickname: playerInfo.nickname,
                avatar: playerInfo.avatar
            })
        })

        newSocket.on('room_state', (data: RoomState) => {
            setScores(data.players)
            setGameState(data.status as any)
            setCurrentImageIdx(data.currentImageIdx)
            setTotalImages(data.imageQueue.length)

            // Sync current image if playing
            if (data.status === 'PLAYING' && data.imageQueue[data.currentImageIdx]) {
                const img = data.imageQueue[data.currentImageIdx]
                setTotalPoints(img.differences?.length || 0)
                // We'd ideally need the found count from the server here, 
                // but for now, we'll reset it or let diff_found sync it.
                if (sceneReady.current) {
                    const scene = phaserGame.current?.scene.getScene('GameScene') as any
                    scene?.loadNewImage(img)
                } else {
                    pendingImage.current = img
                }
            }
        })

        newSocket.on('game_start', (data: { currentImage: ImageData; timer: number }) => {
            setGameState('PLAYING')
            setTimer(data.timer)
            setCurrentImageIdx(0)
            setFoundCount(0)
            setTotalPoints(data.currentImage.differences?.length || 0)

            if (sceneReady.current) {
                const scene = phaserGame.current?.scene.getScene('GameScene') as any
                scene?.loadNewImage(data.currentImage)
            } else {
                pendingImage.current = data.currentImage
            }
        })

        newSocket.on('diff_found', (data: DiffFound) => {
            setScores(data.allScores)
            setFoundCount(prev => prev + 1)
            if (phaserGame.current) {
                const scene = phaserGame.current.scene.getScene('GameScene') as any
                if (scene?.showFoundMarker) scene.showFoundMarker(data.diffId, data.playerName)
            }
        })

        newSocket.on('image_change', (data: { currentImage: ImageData; timer: number; imageIndex: number }) => {
            setTimer(data.timer)
            setCurrentImageIdx(data.imageIndex)
            setFoundCount(0)
            setTotalPoints(data.currentImage.differences?.length || 0)
            if (phaserGame.current) {
                const scene = phaserGame.current.scene.getScene('GameScene') as any
                if (scene?.loadNewImage) scene.loadNewImage(data.currentImage)
            }
        })

        newSocket.on('room_closed', () => {
            navigate('/')
        })

        newSocket.on('game_over', () => {
            setGameState('FINISHED')
            navigate(`/result/${roomCode}`)
        })

        return () => {
            newSocket.disconnect()
            if (phaserGame.current) phaserGame.current.destroy(true)
        }
    }, [roomCode, navigate])

    useEffect(() => {
        if (gameState !== 'PLAYING') return
        const interval = setInterval(() => {
            setTimer(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(interval)
    }, [gameState, currentImageIdx])

    // Lockout countdown timer
    useEffect(() => {
        if (lockoutTimer <= 0) return
        const interval = setInterval(() => {
            setLockoutTimer(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearInterval(interval)
    }, [lockoutTimer])

    useEffect(() => {
        if (!gameContainer.current) return

        class GameScene extends Phaser.Scene {
            private imageTop!: Phaser.GameObjects.Image
            private imageBottom!: Phaser.GameObjects.Image
            private currentDiffs: { id: string; x: number; y: number; radius: number }[] = []
            private markers: Map<string, { graphics: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text }> = new Map()
            private currentImageId: string = ''

            constructor() {
                super({ key: 'GameScene' })
            }

            create() {
                const width = this.scale.width
                const height = this.scale.height

                const bg = this.add.graphics()
                bg.fillStyle(0x020617, 1)
                bg.fillRect(0, 0, width, height)

                this.imageTop = this.add.image(width * 0.25, height / 2, '')
                this.imageBottom = this.add.image(width * 0.75, height / 2, '')
                    .setInteractive()

                this.imageBottom.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    // Check if player is currently banned
                    const parent = (this.game as any).reactProps
                    if (parent.lockoutRef.current > 0) return

                    const rect = this.imageBottom.getBounds()
                    const xPercent = ((pointer.x - rect.x) / rect.width) * 100
                    const yPercent = ((pointer.y - rect.y) / rect.height) * 100
                    this.checkDifference(xPercent, yPercent)
                })

                sceneReady.current = true
                if (pendingImage.current) {
                    this.loadNewImage(pendingImage.current)
                    pendingImage.current = null
                }
            }

            checkDifference(xP: number, yP: number) {
                let foundAny = false
                for (const diff of this.currentDiffs) {
                    const dx = diff.x - xP
                    const dy = diff.y - yP
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (distance <= diff.radius) {
                        foundAny = true
                        if (socket) {
                            socket.emit('player_found_diff', {
                                roomCode,
                                diffId: diff.id,
                                imageId: this.currentImageId
                            })
                        }
                        break
                    }
                }

                // Handle anti-spam logic
                const parent = (this.game as any).reactProps
                if (foundAny) {
                    parent.setMissCount(0)
                } else {
                    parent.setMissCount((prev: number) => {
                        const newCount = prev + 1
                        if (newCount >= 3) {
                            parent.setLockoutTimer(3)
                            return 0 // Reset after trigger
                        }
                        return newCount
                    })
                }
            }

            showFoundMarker(diffId: string, playerName: string) {
                const diff = this.currentDiffs.find(d => d.id === diffId)
                if (!diff || this.markers.has(diffId)) return

                const rect = this.imageBottom.getBounds()
                const x = rect.x + (diff.x / 100) * rect.width
                const y = rect.y + (diff.y / 100) * rect.height
                const radius = (diff.radius / 100) * rect.width

                const graphics = this.add.graphics()
                graphics.lineStyle(4, 0x10b981, 1)
                graphics.strokeCircle(x, y, radius)
                graphics.fillStyle(0x10b981, 0.2)
                graphics.fillCircle(x, y, radius)

                const text = this.add.text(x, y - radius - 15, playerName, {
                    fontSize: '12px',
                    fontStyle: 'bold',
                    color: '#10b981',
                    backgroundColor: '#0f172aa0',
                    padding: { x: 6, y: 3 }
                }).setOrigin(0.5)

                this.markers.set(diffId, { graphics, text })

                this.tweens.add({
                    targets: [graphics, text],
                    alpha: { from: 0, to: 1 },
                    scale: { from: 0.8, to: 1 },
                    duration: 250,
                    ease: 'Back.Out'
                })
            }

            loadNewImage(imageData: ImageData) {
                this.markers.forEach(m => {
                    m.graphics.destroy()
                    m.text.destroy()
                })
                this.markers.clear()
                this.currentDiffs = imageData.differences || []
                this.currentImageId = imageData.id

                this.load.image(`top_${imageData.id}`, imageData.original_url)
                this.load.image(`bot_${imageData.id}`, imageData.modified_url || imageData.original_url)
                this.load.once('complete', () => {
                    this.imageTop.setTexture(`top_${imageData.id}`)
                    this.imageBottom.setTexture(`bot_${imageData.id}`)

                    const width = this.scale.width
                    const height = this.scale.height
                    const isPortrait = height > width

                    if (isPortrait) {
                        // Vertical stacking for mobile/portrait
                        const maxWidth = width * 0.9
                        const maxHeight = height * 0.4 // Each image takes ~40% height

                        // Use original image to determine scale for both to keep them identical
                        const ratio = Math.min(maxWidth / this.imageTop.width, maxHeight / this.imageTop.height)

                        this.imageTop.setScale(ratio)
                        this.imageBottom.setScale(ratio)

                        this.imageTop.setPosition(width * 0.5, height * 0.25)
                        this.imageBottom.setPosition(width * 0.5, height * 0.7)
                    } else {
                        // Side by side side calculation for landscape/desktop
                        const maxWidth = width * 0.48
                        const maxHeight = height * 0.85

                        const ratio = Math.min(maxWidth / this.imageTop.width, maxHeight / this.imageTop.height)

                        this.imageTop.setScale(ratio)
                        this.imageBottom.setScale(ratio)

                        this.imageTop.setPosition(width * 0.25, height * 0.5)
                        this.imageBottom.setPosition(width * 0.75, height * 0.5)
                    }
                })
                this.load.start()
            }
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameContainer.current,
            width: window.innerWidth,
            height: window.innerHeight * 0.82,
            backgroundColor: '#020617',
            scene: GameScene,
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
        }

        const game = new Phaser.Game(config)
        phaserGame.current = game
            ; (game as any).reactProps = { setMissCount, setLockoutTimer, lockoutRef }

        return () => {
            sceneReady.current = false
            phaserGame.current?.destroy(true)
        }
    }, [socket, roomCode])

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden font-['Inter',_sans-serif]">
            <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-slate-950/90 to-transparent flex items-center justify-between z-50 pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="px-4 py-2 bg-indigo-500/10 backdrop-blur-md rounded-2xl border border-indigo-500/20">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Challenge</p>
                        <p className="text-xl font-black text-white leading-none">
                            {currentImageIdx + 1}<span className="text-slate-500 text-sm font-bold"> / {totalImages}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="px-5 py-3 bg-emerald-500/10 backdrop-blur-md rounded-2xl border border-emerald-500/30 flex flex-col items-center">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-2">Points Found</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-white leading-none">
                                {foundCount}
                            </span>
                            <small className="text-emerald-500/50 text-base font-bold">/</small>
                            <span className="text-emerald-500 text-xl font-bold">{totalPoints}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pointer-events-auto">
                    <div className="px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Remaining</p>
                        <p className={`text-xl font-black tabular-nums leading-none ${timer <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timer}s
                        </p>
                    </div>
                </div>
            </div>

            <div ref={gameContainer} className="flex-1 bg-slate-950" />

            {/* Miss Warning Indicator */}
            {missCount > 0 && lockoutTimer === 0 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/20 backdrop-blur-md rounded-xl border border-amber-500/30 text-amber-400 text-sm font-bold animate-pulse z-50">
                    ⚠️ Wrong clicks: {missCount} / 3
                </div>
            )}

            {/* Anti-Spam Lockout Overlay */}
            {lockoutTimer > 0 && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-[100] animate-fade-in">
                    <div className="text-center p-10 rounded-3xl bg-red-500/10 border-2 border-red-500/50 shadow-2xl shadow-red-500/20 max-w-sm">
                        <div className="text-7xl mb-6 animate-bounce">🚫</div>
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Anti-Spam!</h2>
                        <p className="text-red-400 font-bold mb-8">Stop clicking randomly. Wait for a moment.</p>

                        <div className="relative w-24 h-24 mx-auto">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    className="text-white/10"
                                    strokeWidth="8"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="48"
                                    cy="48"
                                />
                                <circle
                                    className="text-red-500 transition-all duration-1000"
                                    strokeWidth="8"
                                    strokeDasharray={2 * Math.PI * 40}
                                    strokeDashoffset={2 * Math.PI * 40 * (1 - lockoutTimer / 3)}
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="transparent"
                                    r="40"
                                    cx="48"
                                    cy="48"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white">
                                {lockoutTimer}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 overflow-x-auto custom-scrollbar z-50 pointer-events-none">
                {scores.sort((a, b) => b.score - a.score).map((p, i) => (
                    <div
                        key={p.id}
                        className={`flex items-center gap-3 px-4 py-2 rounded-2xl border backdrop-blur-xl transition-all pointer-events-auto ${i === 0 ? 'bg-indigo-500/20 border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'bg-slate-900/60 border-white/10'
                            }`}
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner">{p.avatar}</div>
                        <div className="leading-tight">
                            <p className="text-xs font-bold text-white truncate max-w-[80px]">{p.nickname}</p>
                            <p className="text-[10px] font-black text-indigo-400">{p.score} PTS</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
