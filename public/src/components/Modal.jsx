import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders children into document.body via a portal,
 * guaranteeing the overlay escapes any stacking context.
 */
export default function Modal({ onClose, children }) {
  // Prevent body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}
