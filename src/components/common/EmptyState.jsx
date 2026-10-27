import { Inbox } from 'lucide-react'

export function EmptyState({ icon: CustomIcon, title, text, actionText, onAction }) {
  const IconComponent = CustomIcon || Inbox

  return (
    <section className="empty-state">
      <div className="empty-state-icon">
        <IconComponent size={32} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {actionText && onAction && (
        <button type="button" className="button" onClick={onAction}>
          {actionText}
        </button>
      )}
    </section>
  )
}

export function ErrorState({ message, retry }) {
  return (
    <section className="empty-state error-state">
      <h2>Unable to load data</h2>
      <p>{message || 'A network error occurred while communicating with the server.'}</p>
      {retry && (
        <button type="button" className="button secondary" onClick={retry}>
          Retry Request
        </button>
      )}
    </section>
  )
}

export function SkeletonLoader({ rows = 4, height = 36 }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-bar" style={{ height: `${height}px` }} />
      ))}
    </div>
  )
}

export default EmptyState
