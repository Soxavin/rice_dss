import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  )
}

const TYPE_STYLE = {
  success: { bg: '#558b2f', icon: '✓' },
  error:   { bg: '#c62828', icon: '✕' },
  info:    { bg: '#1565c0', icon: 'ℹ' },
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => {
        const s = TYPE_STYLE[t.type] ?? TYPE_STYLE.success
        return (
          <div
            key={t.id}
            onClick={() => onDismiss(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: s.bg, color: '#fff',
              borderRadius: 12, padding: '11px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              minWidth: 240, maxWidth: 360,
              animation: 'toastIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        )
      })}
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
