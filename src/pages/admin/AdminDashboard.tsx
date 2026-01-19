import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../components/Toast'
import { ConfirmDialog } from '../../components/Dialog'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface MasterImage {
    id: string
    name: string
    url: string
    original_url: string | null
    modified_url: string | null
    differences: { id: string; x: number; y: number; radius: number }[]
    created_at: string
}

interface Room {
    id: string
    code: string
    status: string
    created_at: string
    player_count?: number
}

export default function AdminDashboard() {
    const navigate = useNavigate()
    const toast = useToast()
    const [images, setImages] = useState<MasterImage[]>([])
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [imageToDelete, setImageToDelete] = useState<string | null>(null)
    const [isCleaning, setIsCleaning] = useState<string | null>(null)
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null)
    const [roomDeleteDialogOpen, setRoomDeleteDialogOpen] = useState(false)

    useEffect(() => {
        fetchImages()
        fetchRooms()
    }, [])

    const fetchRooms = async () => {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*, players(id)')
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) {
                setRooms(data.map(r => ({
                    ...r,
                    player_count: r.players?.length || 0
                })))
            }
        } catch (err: any) {
            console.error('Error fetching rooms:', err)
        }
    }

    const fetchImages = async () => {
        try {
            const { data, error } = await supabase
                .from('master_images')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setImages(data || [])
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)

        try {
            // Upload to Supabase Storage
            const fileName = `${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
                .from('game-images')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('game-images')
                .getPublicUrl(fileName)

            // Insert into master_images table with both url and original_url
            const { error: insertError } = await supabase
                .from('master_images')
                .insert({
                    name: file.name,
                    url: urlData.publicUrl,
                    original_url: urlData.publicUrl,
                    differences: []
                })

            if (insertError) throw insertError

            toast.success('อัพโหลดรูปภาพสำเร็จ!')
            fetchImages()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsUploading(false)
        }
    }

    const openDeleteDialog = (id: string) => {
        setImageToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!imageToDelete) return

        try {
            const { error } = await supabase
                .from('master_images')
                .delete()
                .eq('id', imageToDelete)

            if (error) throw error
            setImages(images.filter(img => img.id !== imageToDelete))
            toast.success('ลบรูปภาพสำเร็จ!')
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const clearPlayers = async (roomId: string) => {
        setIsCleaning(roomId)
        try {
            const response = await fetch(`/api/rooms/${roomId}/players`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to clear players via API')

            toast.success('ล้างข้อมูลผู้เล่นเรียบร้อยแล้ว')
            fetchRooms()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsCleaning(null)
        }
    }

    const handleDeleteRoom = async () => {
        if (!roomToDelete) return
        try {
            const response = await fetch(`/api/rooms/${roomToDelete}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete room via API')

            setRooms(rooms.filter(r => r.id !== roomToDelete))
            toast.success('ลบห้องเรียบร้อยแล้ว')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setRoomDeleteDialogOpen(false)
            setRoomToDelete(null)
        }
    }

    const getImageStatus = (image: MasterImage) => {
        if (!image.modified_url) return { text: 'ยังไม่มี Modified', color: 'text-amber-400' }
        if (image.differences?.length === 0) return { text: 'ยังไม่กำหนดจุดต่าง', color: 'text-amber-400' }
        return { text: `${image.differences.length} จุดต่าง`, color: 'text-green-400' }
    }

    return (
        <AdminLayout
            title="Master Images"
            subtitle="Manage your game image sets and differences"
            actions={
                <label className="btn btn-primary group cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <span className="group-hover:rotate-90 transition-transform duration-300">
                        {isUploading ? '⏳' : '➕'}
                    </span>
                    {isUploading ? 'Uploading...' : 'Upload Original Image'}
                </label>
            }
        >
            {/* Quick Stats Bar */}
            {!isLoading && images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    <div className="glass-card flex items-center gap-4 bg-indigo-500/5">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl">🖼️</div>
                        <div>
                            <div className="text-2xl font-bold text-white">{images.length}</div>
                            <div className="text-sm text-slate-400 font-medium">Total Images</div>
                        </div>
                    </div>
                    <div className="glass-card flex items-center gap-4 bg-emerald-500/5">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">✨</div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {images.filter(img => img.modified_url).length}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">Modified Sets</div>
                        </div>
                    </div>
                    <div className="glass-card flex items-center gap-4 bg-amber-500/5">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">💎</div>
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {images.reduce((acc, img) => acc + (img.differences?.length || 0), 0)}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">Total Points</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Images Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-lg font-medium">Fetching image library...</p>
                </div>
            ) : images.length === 0 ? (
                <div className="max-w-md mx-auto text-center py-20 px-6 glass-card bg-white/5">
                    <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-xl">📷</div>
                    <h2 className="text-2xl font-bold text-white mb-2">No images yet</h2>
                    <p className="text-slate-400 mb-8">Start by uploading some images to create your first game sets.</p>
                    <label className="btn btn-primary cursor-pointer w-full">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                        />
                        Upload First Image
                    </label>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {images.map((image) => {
                        const status = getImageStatus(image)
                        return (
                            <div key={image.id} className="glass-card group flex flex-col p-4 bg-white/5 hover:bg-white/[0.08] transform hover:-translate-y-1">
                                <div className="aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden mb-4 relative ring-1 ring-white/10 group-hover:ring-indigo-500/50 transition-all duration-300">
                                    <img
                                        src={image.original_url || image.url}
                                        alt={image.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />

                                    {/* Badges Overlay */}
                                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                                        {image.modified_url && (
                                            <div className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                                                <span>✨</span> MODIFIED
                                            </div>
                                        )}
                                        {image.differences?.length > 0 && (
                                            <div className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                                                <span>💎</span> {image.differences.length} PTS
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-white truncate mb-1 text-lg leading-tight group-hover:text-indigo-300 transition-colors">
                                        {image.name}
                                    </h3>
                                    <p className={`text-sm mb-5 font-semibold flex items-center gap-2 ${status.color}`}>
                                        <span className="w-2 h-2 rounded-full bg-current opacity-40 animate-pulse" />
                                        {status.text}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate(`/admin/edit-image/${image.id}`)}
                                        className="btn btn-secondary flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/5 border-white/5 hover:bg-white/10"
                                    >
                                        ✏️ Edit Set
                                    </button>
                                    <button
                                        onClick={() => openDeleteDialog(image.id)}
                                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-500/10"
                                        title="Delete image"
                                    >
                                        <span className="text-lg">🗑️</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Room Management Section */}
            <div className="mt-20 mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">🎮</div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Active Rooms</h2>
                        <p className="text-slate-400 text-sm">Manage game sessions and clean up player data</p>
                    </div>
                </div>

                <div className="glass-card overflow-hidden !p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Room Code</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Players</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {rooms.length > 0 ? rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-lg font-bold text-indigo-400">{room.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${room.status === 'PLAYING' ? 'bg-emerald-500/20 text-emerald-400' :
                                                room.status === 'FINISHED' ? 'bg-slate-500/20 text-slate-400' :
                                                    'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-medium">{room.player_count}</span>
                                            <span className="text-slate-500 text-xs ml-1">Joined</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {new Date(room.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => clearPlayers(room.id)}
                                                disabled={isCleaning === room.id || room.player_count === 0}
                                                className="btn btn-secondary !py-1.5 !px-3 text-xs bg-white/5 hover:bg-white/10 text-slate-300 border-white/5"
                                                title="ล้างรายชื่อผู้เล่น"
                                            >
                                                {isCleaning === room.id ? '⏳' : '🧹'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRoomToDelete(room.id)
                                                    setRoomDeleteDialogOpen(true)
                                                }}
                                                className="btn btn-secondary !py-1.5 !px-3 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                                                title="ลบห้องถาวร"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No rooms created yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm deletion"
                message="Are you sure you want to delete this image set? This action cannot be undone."
                confirmText="Yes, delete it"
                cancelText="Cancel"
                confirmVariant="danger"
            />

            {/* Room Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={roomDeleteDialogOpen}
                onClose={() => setRoomDeleteDialogOpen(false)}
                onConfirm={handleDeleteRoom}
                title="ลบห้องเกม"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบห้องนี้? ข้อมูลผู้เล่นและคะแนนทั้งหมดในห้องนี้จะถูกลบถาวร"
                confirmText="ยืนยันการลบ"
                cancelText="ยกเลิก"
                confirmVariant="danger"
            />
        </AdminLayout>
    )
}
