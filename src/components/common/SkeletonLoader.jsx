export function SkeletonLoader({ rows = 4, height = 36 }) {
  return (
    <div className="skeleton-container">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-bar" style={{ height: `${height}px` }} />
      ))}
    </div>
  )
}

export default SkeletonLoader
