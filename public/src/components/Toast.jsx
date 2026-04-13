import { useState, useEffect, useCallback } from 'react'

// Global toast queue
let _addToast = null
export function showToast(toast) { _addToast?.(toast) }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const add = useCallback((toast) => {
    const id = Date.now()
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  useEffect(() => { _addToast = add; return () => { _addToast = null } }, [add])

  if (!toasts.length) return null

  return (
    <div style={s.container}>
      {toasts.map(t => (
        <div key={t.id} style={s.toast}>
          <div style={s.toastTitle}>{t.title}</div>
          <div style={s.toastBody}>{t.body}</div>
          <button style={s.dismiss} onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>✕</button>
        </div>
      ))}
    </div>
  )
}

const s = {
  container: {
    position: 'fixed', top: '16px', right: '16px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    zIndex: 600, maxWidth: '320px',
  },
  toast: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderLeft: '4px solid var(--primary)',
    borderRadius: '12px',
    padding: '14px 16px',
    boxShadow: 'var(--shadow-lg)',
    position: 'relative',
    animation: 'toastIn 0.25s ease',
  },
  toastTitle: { fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' },
  toastBody: { fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5, paddingRight: '20px' },
  dismiss: {
    position: 'absolute', top: '10px', right: '10px',
    background: 'transparent', border: 'none',
    color: 'var(--text3)', fontSize: '13px', cursor: 'pointer',
    padding: '2px 4px', borderRadius: '4px',
  },
}
