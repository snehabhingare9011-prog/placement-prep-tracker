import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, children, close, onClose, maxWidth = '560px' }) {
  const handleClose = close || onClose || (() => {})

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  return (
    <div className="modal-backdrop" onMouseDown={handleClose}>
      <section
        className="modal"
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export default Modal
