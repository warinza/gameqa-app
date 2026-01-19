import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { QRCodeSVG } from 'qrcode.react'
import { useToast } from '../../components/Toast'
import AdminLayout from '../../components/AdminLayout'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface MasterImage {
    id: string
    name: string
    original_url: string
}

export default function AdminCreateRoom() {
    const navigate = useNavigate()
    const toast = useToast()
    const [images, setImages] = useState<MasterImage[]>([])
    const [selectedImages, setSelectedImages] = useState<string[]>([])
    const [timerPerImage, setTimerPerImage] = useState(60)
    const [isCreating, setIsCreating] = useState(false)
    const [roomCode, setRoomCode] = useState('')

    useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        const { data } = await supabase
            .from('master_images')
            .select('id, name, original_url')
            .order('created_at', { ascending: false })
        setImages(data || [])
    }

    const toggleImage = (id: string) => {
        setSelectedImages(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    const handleCreateRoom = async () => {
        if (selectedImages.length === 0) {
            toast.warning('กรุณาเลือกอย่างน้อย 1 รูป')
            return
        }

        setIsCreating(true)

        try {
            const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
            const response = await fetch(`${apiUrl}/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminId: null, // Allow null for development
                    imageIds: selectedImages,
                    settings: { timerPerImage }
                })
            })

            if (!response.ok) throw new Error('Failed to create room')

            const data = await response.json()
            setRoomCode(data.code)

            sessionStorage.setItem('adminRoom', data.code)
            sessionStorage.setItem('playerInfo', JSON.stringify({
                id: crypto.randomUUID(),
                nickname: 'Admin',
                avatar: '👑',
                roomCode: data.code
            }))
            toast.success('สร้างห้องเกมสำเร็จ!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsCreating(false)
        }
    }

    const joinUrl = roomCode ? `${window.location.origin}/join/${roomCode}` : ''

    return (
        <AdminLayout
            title="Create Game Room"
            subtitle="Configure your game session and invite players"
        >
            {/* Room Created - Show QR */}
            {roomCode ? (
                <div className="max-w-2xl mx-auto">
                    <div className="glass-card animate-scale-in bg-indigo-500/5 relative overflow-hidden border-indigo-500/30">
                        {/* Decorative background glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-3xl rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full" />

                        <div className="relative z-10 text-center py-8">
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">🎉</div>
                            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Room is Ready!</h2>
                            <p className="text-slate-400 mb-10 text-lg">Share the code or QR below with your players.</p>

                            <div className="grid md:grid-cols-2 gap-10 items-center">
                                {/* Left: QR */}
                                <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-3xl shadow-2xl inline-block ring-8 ring-white/5">
                                        <QRCodeSVG value={joinUrl} size={180} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Scan to Join</p>
                                </div>

                                {/* Right: Info */}
                                <div className="text-left space-y-8">
                                    <div>
                                        <p className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-3">Room Access Code</p>
                                        <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 flex items-center justify-between group">
                                            <span className="text-5xl font-black text-white tracking-[0.2em] font-mono">
                                                {roomCode}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(roomCode)
                                                    toast.success('Code copied!')
                                                }}
                                                className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => navigate(`/lobby/${roomCode}`)}
                                            className="btn btn-primary w-full py-4 text-lg shadow-indigo-500/40"
                                        >
                                            🚀 Start Lobby
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(joinUrl)
                                                toast.success('Link copied!')
                                            }}
                                            className="btn btn-secondary w-full py-4 font-bold"
                                        >
                                            🔗 Copy Join Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* Left: Settings & Action */}
                    <div className="lg:col-span-1 space-y-6">
                        <section className="glass-card bg-indigo-500/5 border-indigo-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">⚙️</span>
                                Session Settings
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Timer Per Image
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={10}
                                            max={120}
                                            step={5}
                                            value={timerPerImage}
                                            onChange={(e) => setTimerPerImage(Number(e.target.value))}
                                            className="flex-1 accent-indigo-500"
                                        />
                                        <div className="w-16 h-12 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center font-bold text-white">
                                            {timerPerImage}s
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-sm text-slate-400">
                                    <div className="flex justify-between mb-2">
                                        <span>Selected Images</span>
                                        <span className="text-white font-bold">{selectedImages.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Est. Time</span>
                                        <span className="text-white font-bold">
                                            {Math.floor((selectedImages.length * timerPerImage) / 60)}m {(selectedImages.length * timerPerImage) % 60}s
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <button
                            onClick={handleCreateRoom}
                            disabled={selectedImages.length === 0 || isCreating}
                            className="btn btn-primary w-full py-5 text-xl shadow-indigo-500/30 group disabled:opacity-30 disabled:grayscale transition-all duration-500"
                        >
                            {isCreating ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span>🎮</span>
                                    <span>Launch Game Room</span>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Right: Image Selection */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="glass-card">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm">📸</span>
                                    Select Image Library
                                </h3>
                                <button
                                    onClick={() => setSelectedImages([])}
                                    className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                                >
                                    Clear Selection
                                </button>
                            </div>

                            {images.length === 0 ? (
                                <div className="text-center py-20 px-6 border-2 border-dashed border-white/5 rounded-3xl">
                                    <div className="text-4xl mb-4 opacity-20">📭</div>
                                    <p className="text-slate-500 mb-6">Your image library is empty.</p>
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className="btn btn-secondary py-2 px-6"
                                    >
                                        Go to Upload
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.map((image) => {
                                        const isSelected = selectedImages.includes(image.id)
                                        const index = selectedImages.indexOf(image.id)
                                        return (
                                            <div
                                                key={image.id}
                                                onClick={() => toggleImage(image.id)}
                                                className={`
                                                    relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-300 group
                                                    ${isSelected
                                                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[0.98]'
                                                        : 'border-white/5 hover:border-white/20'
                                                    }
                                                `}
                                            >
                                                <img
                                                    src={image.original_url}
                                                    alt={image.name}
                                                    className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'scale-110 opacity-60' : 'group-hover:scale-110'}`}
                                                />

                                                {/* Selection Indicator */}
                                                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 scale-50'}`}>
                                                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-black shadow-2xl border-4 border-white">
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                {/* Label */}
                                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                                    <p className="text-[10px] font-bold text-white/80 truncate uppercase tracking-widest leading-none">
                                                        {image.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
