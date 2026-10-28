import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, children, close, onClose, maxWidth = '560px' }) {
  const handleClose = close || onClose || (() => {})

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose])

  const responsiveWidth = `min(${maxWidth || '560px'}, calc(100vw - 32px))`

  return (
    <div className="modal-backdrop" onMouseDown={handleClose}>
      <section
        className="modal"
        style={{ width: responsiveWidth, maxWidth: responsiveWidth }}
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
        <div className="modal-body">
          {children}
        </div>
      </section>
    </div>
  )
}

export default Modal
