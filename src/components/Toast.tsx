import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
    warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `${Date.now()}-${Math.random()}`
        setToasts(prev => [...prev, { id, message, type }])

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
    const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
    const info = useCallback((message: string) => showToast(message, 'info'), [showToast])
    const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

// Toast Container
interface ToastContainerProps {
    toasts: Toast[]
    onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    )
}

// Individual Toast
interface ToastItemProps {
    toast: Toast
    onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const icons: Record<ToastType, string> = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    }

    const colors: Record<ToastType, string> = {
        success: 'toast-success',
        error: 'toast-error',
        info: 'toast-info',
        warning: 'toast-warning'
    }

    return (
        <div className={`toast-item ${colors[toast.type]}`}>
            <span className="toast-icon">{icons[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-close"
                onClick={() => onRemove(toast.id)}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    )
}
