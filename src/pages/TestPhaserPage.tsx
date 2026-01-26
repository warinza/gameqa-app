import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'

// Test images - You can change this URL to test with your actual game images
const TEST_IMAGES = [
    'https://hncmmlolorahkzpessos.supabase.co/storage/v1/object/public/game-images/1769151790749_1600_1200.png',
]

export default function TestPhaserPage() {
    const [selectedImage] = useState(TEST_IMAGES[0])
    const [customImageUrl, setCustomImageUrl] = useState('')

    const currentImage = customImageUrl || selectedImage

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-['Inter',_sans-serif]">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">🔬 Phaser Image Quality Test</h1>
                <p className="text-slate-400">Compare Phaser rendering settings vs HTML img tag</p>
            </header>

            {/* Image URL Input */}
            <div className="mb-8 p-4 bg-slate-900/50 rounded-2xl border border-white/10">
                <label className="block text-sm font-bold text-slate-400 mb-2">Custom Image URL (optional)</label>
                <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Paste an image URL to test..."
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* 1. Current Phaser Settings (pixelArt: true) */}
                <PhaserCanvas
                    imageUrl={currentImage}
                    title="🎮 Current GamePage Settings"
                    subtitle="pixelArt: true, antialias: false, roundPixels: true, NEAREST filter"
                    config={{
                        antialias: false,
                        pixelArt: true,
                        roundPixels: true,
                        filterMode: Phaser.Textures.FilterMode.NEAREST
                    }}
                    badgeColor="red"
                />

                {/* 2. Smooth Phaser Settings (antialias: true) */}
                <PhaserCanvas
                    imageUrl={currentImage}
                    title="✨ Smooth Settings"
                    subtitle="pixelArt: false, antialias: true, roundPixels: false, LINEAR filter"
                    config={{
                        antialias: true,
                        pixelArt: false,
                        roundPixels: false,
                        filterMode: Phaser.Textures.FilterMode.LINEAR
                    }}
                    badgeColor="green"
                />

                {/* 3. Maximum Quality Settings */}
                <PhaserCanvasMaxQuality
                    imageUrl={currentImage}
                    title="🚀 Maximum Quality"
                    subtitle="WEBGL forced, antialiasGL: true, full DPI, high-performance"
                    badgeColor="purple"
                />

                {/* 4. HTML img tag (Reference) */}
                <div className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                📷 HTML img tag (Reference)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Standard browser rendering - should be sharp</p>
                        </div>
                    </div>
                    <div className="h-[400px] bg-slate-950 flex items-center justify-center p-4">
                        <img
                            src={currentImage}
                            alt="HTML Reference"
                            className="max-w-full max-h-full object-contain"
                            style={{ imageRendering: 'auto' }}
                        />
                    </div>
                </div>
            </div>

            {/* Full Width Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 rounded-2xl border border-red-500/30 overflow-hidden">
                    <div className="p-4 border-b border-red-500/20 bg-red-500/5">
                        <h3 className="text-white font-bold">🎮 CURRENT: pixelArt Mode (Jagged)</h3>
                    </div>
                    <PhaserCanvasLarge
                        imageUrl={currentImage}
                        config={{
                            antialias: false,
                            pixelArt: true,
                            roundPixels: true,
                            filterMode: Phaser.Textures.FilterMode.NEAREST
                        }}
                    />
                </div>

                <div className="bg-slate-900/50 rounded-2xl border border-green-500/30 overflow-hidden">
                    <div className="p-4 border-b border-green-500/20 bg-green-500/5">
                        <h3 className="text-white font-bold">✨ SUGGESTED: Smooth Mode (Sharp)</h3>
                    </div>
                    <PhaserCanvasLarge
                        imageUrl={currentImage}
                        config={{
                            antialias: true,
                            pixelArt: false,
                            roundPixels: false,
                            filterMode: Phaser.Textures.FilterMode.LINEAR
                        }}
                    />
                </div>
            </div>

            {/* Recommendations */}
            <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <h3 className="text-xl font-bold text-emerald-400 mb-4">💡 Recommendations</h3>
                <div className="space-y-3 text-slate-300">
                    <p>If the <strong className="text-green-400">green/smooth version</strong> looks sharper, change these settings in <code className="bg-slate-800 px-2 py-1 rounded text-indigo-300">GamePage.tsx</code>:</p>
                    <pre className="bg-slate-900 p-4 rounded-xl text-sm overflow-x-auto">
                        {`const config: any = {
    // ... other settings
    render: {
        antialias: true,        // ✅ Enable smooth edges
        pixelArt: false,        // ✅ Disable pixel art mode
        roundPixels: false      // ✅ Allow sub-pixel positioning
    },
    resolution: window.devicePixelRatio || 1
};

// And remove the texture filter line:
// ❌ this.textures.get(...).setFilter(Phaser.Textures.FilterMode.NEAREST);`}
                    </pre>
                </div>
            </div>
        </div>
    )
}

interface PhaserCanvasProps {
    imageUrl: string
    title: string
    subtitle: string
    config: {
        antialias: boolean
        pixelArt: boolean
        roundPixels: boolean
        filterMode: Phaser.Textures.FilterMode
    }
    badgeColor: 'red' | 'green' | 'blue' | 'purple'
}

function PhaserCanvas({ imageUrl, title, subtitle, config, badgeColor }: PhaserCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const gameRef = useRef<Phaser.Game | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        class TestScene extends Phaser.Scene {
            private testImage!: Phaser.GameObjects.Image

            constructor() {
                super({ key: 'TestScene' })
            }

            preload() {
                this.load.image('testImage', imageUrl)
            }

            create() {
                const width = this.scale.width
                const height = this.scale.height

                // Background
                const bg = this.add.graphics()
                bg.fillStyle(0x020617, 1)
                bg.fillRect(0, 0, width, height)

                // Add image
                this.testImage = this.add.image(width / 2, height / 2, 'testImage')

                // Apply filter mode
                this.textures.get('testImage').setFilter(config.filterMode)

                // Scale to fit
                const nativeW = this.testImage.width
                const nativeH = this.testImage.height
                const maxW = width * 0.9
                const maxH = height * 0.9
                const ratio = Math.min(maxW / nativeW, maxH / nativeH, 1)
                this.testImage.setScale(ratio)
            }
        }

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: containerRef.current.clientWidth,
            height: 400,
            backgroundColor: '#020617',
            scene: TestScene,
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            render: {
                antialias: config.antialias,
                pixelArt: config.pixelArt,
                roundPixels: config.roundPixels
            },
            resolution: Math.min(window.devicePixelRatio || 1, 3)
        } as any)

        gameRef.current = game

        // Apply CSS image rendering based on config
        const canvas = game.canvas
        if (canvas) {
            canvas.style.imageRendering = config.pixelArt ? 'pixelated' : 'auto'
        }

        return () => {
            game.destroy(true)
        }
    }, [imageUrl, config])

    const badgeColors = {
        red: 'bg-red-500',
        green: 'bg-green-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500'
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${badgeColors[badgeColor]}`}></span>
                    {title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
            <div ref={containerRef} className="h-[400px] bg-slate-950" />
        </div>
    )
}

interface PhaserCanvasLargeProps {
    imageUrl: string
    config: {
        antialias: boolean
        pixelArt: boolean
        roundPixels: boolean
        filterMode: Phaser.Textures.FilterMode
    }
}

function PhaserCanvasLarge({ imageUrl, config }: PhaserCanvasLargeProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const gameRef = useRef<Phaser.Game | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        class TestScene extends Phaser.Scene {
            private testImage!: Phaser.GameObjects.Image

            constructor() {
                super({ key: 'TestScene' })
            }

            preload() {
                this.load.image('testImage', imageUrl)
            }

            create() {
                const width = this.scale.width
                const height = this.scale.height

                const bg = this.add.graphics()
                bg.fillStyle(0x020617, 1)
                bg.fillRect(0, 0, width, height)

                this.testImage = this.add.image(width / 2, height / 2, 'testImage')
                this.textures.get('testImage').setFilter(config.filterMode)

                const nativeW = this.testImage.width
                const nativeH = this.testImage.height
                const maxW = width * 0.95
                const maxH = height * 0.95
                const ratio = Math.min(maxW / nativeW, maxH / nativeH, 1)
                this.testImage.setScale(ratio)
            }
        }

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: containerRef.current.clientWidth,
            height: 500,
            backgroundColor: '#020617',
            scene: TestScene,
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            render: {
                antialias: config.antialias,
                pixelArt: config.pixelArt,
                roundPixels: config.roundPixels
            },
            resolution: Math.min(window.devicePixelRatio || 1, 3)
        } as any)

        gameRef.current = game

        const canvas = game.canvas
        if (canvas) {
            canvas.style.imageRendering = config.pixelArt ? 'pixelated' : 'auto'
        }

        return () => {
            game.destroy(true)
        }
    }, [imageUrl, config])

    return <div ref={containerRef} className="h-[500px] bg-slate-950" />
}

// Maximum Quality Component - Uses all available quality enhancements
interface PhaserCanvasMaxQualityProps {
    imageUrl: string
    title: string
    subtitle: string
    badgeColor: 'red' | 'green' | 'blue' | 'purple'
}

function PhaserCanvasMaxQuality({ imageUrl, title, subtitle, badgeColor }: PhaserCanvasMaxQualityProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const gameRef = useRef<Phaser.Game | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const dpr = window.devicePixelRatio || 1
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = 400

        class MaxQualityScene extends Phaser.Scene {
            private testImage!: Phaser.GameObjects.Image

            constructor() {
                super({ key: 'MaxQualityScene' })
            }

            preload() {
                this.load.image('testImage', imageUrl)
            }

            create() {
                const width = this.scale.width
                const height = this.scale.height

                // Background
                const bg = this.add.graphics()
                bg.fillStyle(0x020617, 1)
                bg.fillRect(0, 0, width, height)

                // Add image
                this.testImage = this.add.image(width / 2, height / 2, 'testImage')

                // Use LINEAR filter for smooth scaling
                this.textures.get('testImage').setFilter(Phaser.Textures.FilterMode.LINEAR)

                // Scale to fit
                const nativeW = this.testImage.width
                const nativeH = this.testImage.height
                const maxW = width * 0.9
                const maxH = height * 0.9
                const ratio = Math.min(maxW / nativeW, maxH / nativeH, 1)
                this.testImage.setScale(ratio)
            }
        }

        const game = new Phaser.Game({
            type: Phaser.WEBGL, // Force WebGL for best quality
            parent: containerRef.current,
            width: containerWidth * dpr,  // Native resolution
            height: containerHeight * dpr,
            backgroundColor: '#020617',
            scene: MaxQualityScene,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: containerWidth * dpr,
                height: containerHeight * dpr
            },
            render: {
                antialias: true,
                antialiasGL: true,
                pixelArt: false,
                roundPixels: false,
                desynchronized: true,
                powerPreference: 'high-performance',
                mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
            },
            banner: false
        } as any)

        gameRef.current = game

        // Ensure canvas uses smooth rendering
        const canvas = game.canvas
        if (canvas) {
            canvas.style.imageRendering = 'auto'
            canvas.style.width = `${containerWidth}px`
            canvas.style.height = `${containerHeight}px`
        }

        return () => {
            game.destroy(true)
        }
    }, [imageUrl])

    const badgeColors = {
        red: 'bg-red-500',
        green: 'bg-green-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500'
    }

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${badgeColors[badgeColor]}`}></span>
                    {title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            </div>
            <div ref={containerRef} className="h-[400px] bg-slate-950" />
        </div>
    )
}
