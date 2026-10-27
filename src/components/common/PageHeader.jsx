export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <section className="page-header">
      <div>
        {eyebrow && <p>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <span>{description}</span>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </section>
  )
}

export default PageHeader
