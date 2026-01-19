import { useEffect, useCallback, ReactNode } from 'react'

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    showCloseButton?: boolean
    closeOnBackdrop?: boolean
    closeOnEsc?: boolean
}

export default function Dialog({
    isOpen,
    onClose,
    title,
    children,
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEsc = true
}: DialogProps) {
    // Handle ESC key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEsc) {
            onClose()
        }
    }, [onClose, closeOnEsc])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose()
        }
    }

    return (
        <div className="dialog-backdrop" onClick={handleBackdropClick}>
            <div className="dialog-content animate-scale-in">
                {(title || showCloseButton) && (
                    <div className="dialog-header">
                        {title && <h2 className="dialog-title">{title}</h2>}
                        {showCloseButton && (
                            <button
                                className="dialog-close-btn"
                                onClick={onClose}
                                aria-label="Close dialog"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}
                <div className="dialog-body">
                    {children}
                </div>
            </div>
        </div>
    )
}

// Confirm Dialog Helper Component
interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    confirmVariant?: 'danger' | 'primary'
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'ยืนยัน',
    message,
    confirmText = 'ยืนยัน',
    cancelText = 'ยกเลิก',
    confirmVariant = 'danger'
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onClose()
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={title}>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="btn btn-secondary"
                >
                    {cancelText}
                </button>
                <button
                    onClick={handleConfirm}
                    className={`btn ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                >
                    {confirmText}
                </button>
            </div>
        </Dialog>
    )
}
