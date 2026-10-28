import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PageHeader from '../components/common/PageHeader'
import EmptyState from '../components/common/EmptyState'
import SkeletonLoader from '../components/common/SkeletonLoader'
import api from '../api/client'

export function CompaniesPage() {
  const { user, setTarget, showToast } = useAuth()
  const navigate = useNavigate()

  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [settingTargetId, setSettingTargetId] = useState(null)

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
    return (
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.roles.join(' ').toLowerCase().includes(query.toLowerCase()) ||
      company.requiredSkills.join(' ').toLowerCase().includes(query.toLowerCase())
    )
  })

  const handlePrepareNow = async (company) => {
    setSettingTargetId(company._id)
    try {
      const role = company.roles?.[0] || 'Software Engineer'
      await setTarget(company._id, role)
      navigate('/dashboard')
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to set target', 'danger')
    } finally {
      setSettingTargetId(null)
    }
  }

  const handleSetTarget = async (company) => {
    setSettingTargetId(company._id)
    try {
      const role = company.roles?.[0] || 'Software Engineer'
      await setTarget(company._id, role)
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to set target', 'danger')
    } finally {
      setSettingTargetId(null)
    }
  }

  return (
    <div className="companies-page">
      <PageHeader
        eyebrow="TARGET COMPANY DIRECTORY"
        title="Select or Change Your Target Company & Role"
        description="Browse recruiting partner companies, inspect selection rounds, package bands, and activate your target to customize your entire preparation workspace."
      />

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

        <span className="results-count">
          Showing <b>{filtered.length}</b> companies
        </span>
      </section>

      {/* Company Grid */}
      {loading ? (
        <SkeletonLoader rows={6} height={180} />
      ) : filtered.length > 0 ? (
        <section className="company-grid">
          {filtered.map(company => {
            const isTarget = currentCompanyId === company._id

            return (
              <article
                key={company._id}
                className={`company-card ${isTarget ? 'targeted' : ''}`}
              >
                <div className="company-card-top">
                  <CompanyMark company={company} large />
                  {isTarget && (
                    <div className="company-card-top-tags">
                      <span className="targeted-tag">Your Target</span>
                    </div>
                  )}
                </div>

                <h2>{company.name}</h2>
                <p className="company-role-subtitle">{company.roles[0] || 'Software Engineer'}</p>

                <div className="company-tags">
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
                  <button
                    type="button"
                    className="button primary prepare-btn"
                    onClick={() => handlePrepareNow(company)}
                    disabled={settingTargetId === company._id}
                  >
                    {settingTargetId === company._id ? 'Updating...' : isTarget ? 'Continue Prep' : 'Prepare Now'} <ArrowRight size={13} />
                  </button>

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
                        disabled={settingTargetId === company._id}
                      >
                        {settingTargetId === company._id ? '...' : 'Target'}
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
          title="No companies found"
          text="Try adjusting your search keywords."
          actionText="Clear Search"
          onAction={() => setQuery('')}
        />
      )}
    </div>
  )
}

export default CompaniesPage
