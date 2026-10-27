import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Check, Plus, X, ArrowRight, Building2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import ProgressBar from '../components/common/ProgressBar'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function CompaniesPage() {
  const { user, setTarget } = useAuth()
  const navigate = useNavigate()

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [comparison, setComparison] = useState([])

  const currentCompanyId = user?.targetCompany?._id || user?.targetCompany

  useEffect(() => {
    async function fetchCompanies() {
      setLoading(true)
      try {
        const res = await api.companies.getAll()
        if (res.success && res.companies) {
          setCompanies(res.companies)
        }
      } catch (err) {
        console.error('Failed to load companies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const filtered = companies.filter(company => {
    const matchesQuery =
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.roles.join(' ').toLowerCase().includes(query.toLowerCase()) ||
      company.requiredSkills.join(' ').toLowerCase().includes(query.toLowerCase())
    const matchesDifficulty = difficulty === 'All' || company.difficulty === difficulty
    return matchesQuery && matchesDifficulty
  })

  const toggleCompare = (id) => {
    if (comparison.includes(id)) {
      setComparison(comparison.filter(item => item !== id))
    } else if (comparison.length < 3) {
      setComparison([...comparison, id])
    }
  }

  const handleSetTarget = async (company) => {
    await setTarget(company._id, company.roles[0])
  }

  return (
    <div className="companies-page">
      <PageHeader
        eyebrow="COMPANY EXPLORER & BLUEPRINTS"
        title="Prepare for the companies you want."
        description="Compare recruitment patterns, essential skill requirements, and your calculated readiness."
      >
        {comparison.length > 0 && (
          <button
            type="button"
            className="button secondary"
            onClick={() => setComparison([])}
          >
            Clear Comparison ({comparison.length})
          </button>
        )}
      </PageHeader>

      {/* Toolbar */}
      <section className="company-toolbar">
        <label className="search-input">
          <Search size={16} />
          <input
            placeholder="Search company, job role, or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <label className="select-input">
          <Filter size={16} />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="All">All Difficulty Tiers</option>
            <option value="Foundation">Foundation Tier</option>
            <option value="Intermediate">Intermediate Tier</option>
            <option value="Advanced">Advanced Tier</option>
          </select>
        </label>

        <span className="results-count">
          Showing <b>{filtered.length}</b> companies
        </span>
      </section>

      {/* Comparison Floating Bar */}
      {comparison.length > 0 && (
        <section className="comparison-bar">
          <div className="comparison-pills">
            <span><b>{comparison.length} / 3</b> selected to compare:</span>
            {comparison.map(id => {
              const comp = companies.find(c => c._id === id)
              return (
                <button
                  key={id}
                  type="button"
                  className="compare-pill"
                  onClick={() => toggleCompare(id)}
                >
                  <CompanyMark company={comp} size={16} />
                  <span>{comp?.name}</span>
                  <X size={12} />
                </button>
              )
            })}
          </div>
          <button
            type="button"
            className="button"
            onClick={() => navigate('/analytics')}
          >
            Compare in Analytics <ArrowRight size={14} />
          </button>
        </section>
      )}

      {/* Company Grid */}
      {loading ? (
        <SkeletonLoader rows={6} height={180} />
      ) : filtered.length > 0 ? (
        <section className="company-grid">
          {filtered.map(company => {
            const isTarget = currentCompanyId === company._id
            const isCompared = comparison.includes(company._id)

            return (
              <article
                key={company._id}
                className={`company-card ${isTarget ? 'targeted' : ''}`}
              >
                <div className="company-card-top">
                  <CompanyMark company={company} large />
                  <div className="company-card-top-tags">
                    {isTarget && <span className="targeted-tag">Your Target</span>}
                    <button
                      type="button"
                      className={`compare-control ${isCompared ? 'selected' : ''}`}
                      onClick={() => toggleCompare(company._id)}
                      title="Add to comparison"
                    >
                      {isCompared ? <Check size={13} /> : <Plus size={13} />}
                      <span>Compare</span>
                    </button>
                  </div>
                </div>

                <h2>{company.name}</h2>
                <p className="company-role-subtitle">{company.roles[0] || 'Software Engineer'}</p>

                <div className="company-tags">
                  <span className={`difficulty-badge ${company.difficulty.toLowerCase()}`}>
                    {company.difficulty}
                  </span>
                  <span>{company.recruitmentRounds?.length || 4} Rounds</span>
                </div>

                <p className="company-card-desc">{company.description}</p>

                <div className="company-skills">
                  {company.requiredSkills.slice(0, 4).map(skill => (
                    <span key={skill}>{skill}</span>
                  ))}
                  {company.requiredSkills.length > 4 && (
                    <small>+{company.requiredSkills.length - 4}</small>
                  )}
                </div>

                <div className="company-card-actions">
                  <Link
                    to={`/company-prep?company=${company._id || company.code}`}
                    className="button primary prepare-btn"
                  >
                    Prepare Now <ArrowRight size={13} />
                  </Link>

                  <div className="company-secondary-actions">
                    <Link
                      to={`/companies/${company._id || company.code}`}
                      className="button secondary outline-btn"
                    >
                      Blueprint
                    </Link>

                    {!isTarget && (
                      <button
                        type="button"
                        className="button secondary target-btn"
                        onClick={() => handleSetTarget(company)}
                      >
                        Target
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState
          icon={Building2}
          title="No companies match your filters"
          text="Try adjusting your search keywords or clearing difficulty filters."
          actionText="Reset Filters"
          onAction={() => { setQuery(''); setDifficulty('All') }}
        />
      )}
    </div>
  )
}

export default CompaniesPage
