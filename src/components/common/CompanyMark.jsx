export function CompanyMark({ company, large = false, size }) {
  const mark = company?.mark || company?.name?.[0]?.toUpperCase() || 'H'
  const color = company?.color || '#1769d1'

  const style = {
    backgroundColor: color,
    ...(size && { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.45)}px` })
  }

  return (
    <span
      className={`company-mark ${large ? 'large' : ''}`}
      style={style}
      aria-label={company?.name || 'Company Mark'}
    >
      {mark}
    </span>
  )
}

export default CompanyMark
