import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '../../components/AdminLayout'
import { useToast } from '../../components/Toast'
import { ConfirmDialog } from '../../components/Dialog'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface DifferencePoint {
    id: string
    x: number
    y: number
    radius: number
}

interface ImageData {
    id: string
    name: string
    url: string
    original_url: string | null
    modified_url: string | null
    differences: DifferencePoint[]
}

export default function AdminEditImage() {
    const { imageId } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const [imageData, setImageData] = useState<ImageData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploadingModified, setIsUploadingModified] = useState(false)
    const [differences, setDifferences] = useState<DifferencePoint[]>([])
    const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [pointToDelete, setPointToDelete] = useState<string | null>(null)

    useEffect(() => {
        fetchImageData()
    }, [imageId])

    const fetchImageData = async () => {
        try {
            const { data, error } = await supabase
                .from('master_images')
                .select('*')
                .eq('id', imageId)
                .single()

            if (error) throw error

            setImageData(data)
            setDifferences(data.differences || [])
        } catch (err: any) {
            toast.error('Could not find image set')
            navigate('/admin')
        } finally {
            setIsLoading(false)
        }
    }

    const handleModifiedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingModified(true)
        try {
            const fileName = `modified_${Date.now()}_${file.name}`
            const { error: uploadError } = await supabase.storage
                .from('game-images')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('game-images')
                .getPublicUrl(fileName)

            // Update database
            const { error: updateError } = await supabase
                .from('master_images')
                .update({ modified_url: urlData.publicUrl })
                .eq('id', imageId)

            if (updateError) throw updateError

            setImageData(prev => prev ? { ...prev, modified_url: urlData.publicUrl } : null)
            toast.success('Modified image uploaded successfully!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsUploadingModified(false)
        }
    }

    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const img = e.currentTarget.querySelector('img')
        if (!img) return

        const rect = img.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        // Check if clicking on existing point
        const clickedPoint = differences.find(diff => {
            const dx = diff.x - x
            const dy = diff.y - y
            const distance = Math.sqrt(dx * dx + dy * dy)
            return distance < diff.radius
        })

        if (clickedPoint) {
            setSelectedPoint(clickedPoint.id)
        } else {
            // Add new point
            const newPoint: DifferencePoint = {
                id: `diff_${Date.now()}`,
                x,
                y,
                radius: 5
            }
            setDifferences([...differences, newPoint])
            setSelectedPoint(newPoint.id)
            toast.success(`Point #${differences.length + 1} added`)
        }
    }

    const handleRadiusChange = (radius: number) => {
        if (!selectedPoint) return
        setDifferences(differences.map(d =>
            d.id === selectedPoint ? { ...d, radius: Math.max(2, Math.min(20, radius)) } : d
        ))
    }

    const openDeletePointDialog = () => {
        if (!selectedPoint) return
        setPointToDelete(selectedPoint)
        setDeleteDialogOpen(true)
    }

    const handleDeletePoint = () => {
        if (!pointToDelete) return
        setDifferences(differences.filter(d => d.id !== pointToDelete))
        setSelectedPoint(null)
        toast.success('Point removed')
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('master_images')
                .update({ differences })
                .eq('id', imageId)

            if (error) throw error
            toast.success('Changes saved successfully!')
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const selectedPointData = differences.find(d => d.id === selectedPoint)

    if (isLoading) {
        return (
            <AdminLayout title="Edit Challenge" subtitle="Preparing workspace...">
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-lg font-medium">Fetching image data...</p>
                </div>
            </AdminLayout>
        )
    }

    const originalUrl = imageData?.original_url || imageData?.url
    const modifiedUrl = imageData?.modified_url

    return (
        <AdminLayout
            title={imageData?.name || 'Edit Image Set'}
            subtitle="Mark differences on the modified image to create the game challenge"
        >
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                {/* Editor Area (Left/Top) */}
                <div className="xl:col-span-9 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card bg-white/5 border-white/5 overflow-hidden p-0 flex flex-col">
                            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px]">A</span>
                                    Original View
                                </h3>
                            </div>
                            <div className="h-[400px] md:h-[650px] bg-slate-950 flex items-center justify-center relative overflow-hidden p-4">
                                {originalUrl ? (
                                    <div className="w-full h-full relative flex items-center justify-center">
                                        <div className="relative inline-block shadow-2xl">
                                            <img
                                                src={originalUrl}
                                                alt="Original"
                                                className="max-w-full max-h-full object-contain block pointer-events-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-600 font-bold italic">No Original Image</div>
                                )}
                            </div>
                        </div>

                        <div className="glass-card bg-indigo-500/5 border-indigo-500/20 overflow-hidden p-0 flex flex-col">
                            <div className="p-4 border-b border-indigo-500/10 bg-indigo-500/[0.03] flex items-center justify-between">
                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-[10px]">B</span>
                                    Modified Challenge
                                </h3>
                                <div className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    Mark Points Here
                                </div>
                            </div>

                            <div className="h-[400px] md:h-[650px] bg-slate-950 flex items-center justify-center relative cursor-crosshair group overflow-hidden p-4">
                                {modifiedUrl ? (
                                    <div
                                        className="w-full h-full relative flex items-center justify-center"
                                        onClick={handleImageClick}
                                    >
                                        <div className="relative inline-block shadow-2xl">
                                            <img
                                                src={modifiedUrl}
                                                alt="Modified"
                                                className="max-w-full max-h-full object-contain block select-none pointer-events-none"
                                            />

                                            {/* Difference Points Overlay */}
                                            {differences.map((diff, index) => (
                                                <div
                                                    key={diff.id}
                                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-auto ${selectedPoint === diff.id
                                                        ? 'z-40'
                                                        : 'z-30'
                                                        }`}
                                                    style={{
                                                        left: `${diff.x}%`,
                                                        top: `${diff.y}%`,
                                                        width: `${diff.radius * 2}%`,
                                                        height: `${diff.radius * 2}%`,
                                                        minWidth: '20px',
                                                        minHeight: '20px'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedPoint(diff.id)
                                                    }}
                                                >
                                                    <div className={`
                                                        w-full h-full rounded-full border-2 shadow-2xl transition-all duration-300
                                                        ${selectedPoint === diff.id
                                                            ? 'border-indigo-400 bg-indigo-500/30 ring-4 ring-indigo-500/20 scale-110'
                                                            : 'border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/30'
                                                        }
                                                    `}>
                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-900 rounded-lg text-[10px] font-bold text-white whitespace-nowrap border border-white/10 shadow-xl">
                                                            #{index + 1}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 p-10">
                                        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-4xl shadow-2xl">➕</div>
                                        <div className="text-center">
                                            <p className="text-slate-400 font-bold mb-6">Need a modified version to start marking</p>
                                            <label className="btn btn-primary py-3 px-8 cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleModifiedUpload}
                                                    className="hidden"
                                                    disabled={isUploadingModified}
                                                />
                                                {isUploadingModified ? '⏳ Uploading...' : 'Upload Modified Image'}
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Editor Instructions Table */}
                    <div className="glass-card bg-white/5 border-white/5">
                        <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                            Quick guide
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-400">1</div>
                                <p className="text-sm text-slate-400">Click anywhere on the <span className="text-indigo-300 font-bold">Modified view</span> to add a new difference point.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-400">2</div>
                                <p className="text-sm text-slate-400">Adjust the <span className="text-white font-bold">radius slider</span> on the right to match the size of the difference.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-400">3</div>
                                <p className="text-sm text-slate-400">Make sure to <span className="text-emerald-400 font-bold">Save Changes</span> when you're done marking all points.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Properties Area (Right/Bottom) */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Selected Point Editor */}
                    <section className="glass-card border-white/5 bg-slate-900/50">
                        <header className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">🎯</span>
                                Point Inspector
                            </h3>
                            {selectedPointData && (
                                <button
                                    onClick={() => setSelectedPoint(null)}
                                    className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest"
                                >
                                    Deselect
                                </button>
                            )}
                        </header>

                        {selectedPointData ? (
                            <div className="space-y-8 animate-fade-in">
                                <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Editing Point</p>
                                        <p className="text-xl font-black text-white">#{differences.findIndex(d => d.id === selectedPoint) + 1}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Position</p>
                                        <p className="text-sm font-mono text-indigo-400">{selectedPointData.x.toFixed(1)}%, {selectedPointData.y.toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Collision Radius</label>
                                        <span className="text-2xl font-black text-white">{selectedPointData.radius}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="2"
                                        max="20"
                                        step="0.5"
                                        value={selectedPointData.radius}
                                        onChange={(e) => handleRadiusChange(Number(e.target.value))}
                                        className="w-full accent-indigo-500 h-2 rounded-lg"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                        <span>Tiny</span>
                                        <span>Precise</span>
                                        <span>Large</span>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-3">
                                    <button
                                        onClick={openDeletePointDialog}
                                        className="btn btn-secondary w-full py-3 text-red-400 border-red-500/10 hover:bg-red-500/10 font-bold"
                                    >
                                        🗑️ Delete Point
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6 bg-slate-950/30 rounded-3xl border border-dashed border-white/5">
                                <p className="text-slate-500 font-medium italic">Select a point on the image to edit its properties.</p>
                            </div>
                        )}
                    </section>

                    {/* Points Overview */}
                    <section className="glass-card bg-white/5 border-white/5">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-1">
                            Points List ({differences.length})
                        </h3>

                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {differences.length === 0 ? (
                                <p className="text-center py-8 text-xs font-bold text-slate-600 uppercase">No points marked</p>
                            ) : (
                                differences.map((diff, i) => (
                                    <div
                                        key={diff.id}
                                        onClick={() => setSelectedPoint(diff.id)}
                                        className={`
                                            w-full flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border
                                            ${selectedPoint === diff.id
                                                ? 'bg-indigo-500 text-white border-indigo-400 scale-[1.02] shadow-lg'
                                                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${selectedPoint === diff.id ? 'bg-white text-indigo-600' : 'bg-slate-800'}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 text-xs font-bold">
                                            RADIUS: {diff.radius}%
                                        </div>
                                        <div className="text-[10px] font-mono opacity-50">
                                            {diff.x.toFixed(0)},{diff.y.toFixed(0)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete Point Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeletePoint}
                title="Remove Point"
                message="Are you sure you want to remove this difference point? This cannot be undone."
                confirmText="Yes, remove it"
                cancelText="Cancel"
                confirmVariant="danger"
            />

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-[60] py-6 px-10 bg-slate-900/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between animate-slide-up ml-[280px] group-data-[sidebar-collapsed=true]:ml-[80px] transition-all duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl shadow-inner">🎯</div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Total Points</p>
                        <p className="text-xl font-black text-white leading-none">{differences.length} <span className="text-indigo-400 opacity-50 text-sm">Marked</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="btn btn-secondary py-3 px-8 font-bold border-white/5 hover:bg-white/10"
                    >
                        ← Exit Editor
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-primary min-w-[200px] py-3.5 px-10 text-lg font-black shadow-2xl shadow-indigo-500/40 relative overflow-hidden group/save"
                    >
                        {isSaving ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving...</span>
                            </div>
                        ) : (
                            <>
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    💾 Save Challenge
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover/save:opacity-100 transition-opacity" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Add padding at bottom to prevent overlap with sticky bar */}
            <div className="h-32" />
        </AdminLayout >
    )
}
