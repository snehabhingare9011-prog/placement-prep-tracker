export function ProgressBar({ value = 0, tone = 'blue', label, showValue = true, height = 6 }) {
  const clamped = Math.max(0, Math.min(Math.round(value || 0), 100))

  return (
    <div className="progress-row">
      {label && (
        <div>
          <span>{label}</span>
          {showValue && <b>{clamped}%</b>}
        </div>
      )}
      <i className={`progress-track ${tone}`} style={{ height: `${height}px` }}>
        <em style={{ width: `${clamped}%` }} />
      </i>
    </div>
  )
}

export default ProgressBar
