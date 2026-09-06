import { createContext, useCallback, useContext, useRef, useState } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

const ToastContext = createContext<(message: string, type?: 'success' | 'error') => void>(
  () => {},
)

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const push = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current
    setToasts((current) => [...current, { id, message, type }])
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 50,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: 320,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 'var(--cth-text-body-md)',
              fontWeight: 500,
              background: 'var(--cth-cream-100)',
              color: toast.type === 'success' ? 'var(--cth-mint)' : 'var(--cth-coral)',
              boxShadow: toast.type === 'success'
                ? 'inset 0 0 0 1px var(--cth-mint), 0 2px 0 var(--cth-shadow-hard)'
                : 'inset 0 0 0 1px var(--cth-coral), 0 2px 0 var(--cth-shadow-hard)',
            }}
          >
            <span style={{ fontSize: 16 }}>
              {toast.type === 'success' ? '\u2713' : '\u2717'}
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
