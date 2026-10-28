import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Briefcase,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Milestone,
  Target,
  FileCheck2,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CompanyMark from '../components/common/CompanyMark'
import PublicNavbar from '../components/layout/PublicNavbar'
import api from '../api/client'

export function OnboardingPage() {
  const { user, setTarget, showToast } = useAuth()
  const navigate = useNavigate()

  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load companies and pre-select current target if set, or default to first company
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await api.companies.getAll()
        if (res.success && res.companies && res.companies.length > 0) {
          setCompanies(res.companies)
          const currentTargetId = user?.targetCompany?._id || user?.targetCompany
          const initialCo = (currentTargetId && res.companies.find(c => c._id === currentTargetId)) || res.companies[0]
          setSelectedCompanyId(initialCo._id)
          setSelectedRole(user?.targetRole || initialCo.roles?.[0] || 'Software Engineer')
        }
      } catch (err) {
        console.error('Failed to load companies for onboarding:', err)
        showToast('Failed to load target companies. Please try again.', 'danger')
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [user])

  const selectedCompany = companies.find(c => c._id === selectedCompanyId) || companies[0]

  const handleCompanySelect = (companyId) => {
    setSelectedCompanyId(companyId)
    const co = companies.find(c => c._id === companyId)
    if (co && co.roles && co.roles.length > 0) {
      setSelectedRole(co.roles[0])
    }
  }

  const handleStartPreparation = async () => {
    if (!selectedCompanyId) {
      showToast('Please select a target company to begin.', 'warning')
      return
    }
    setSaving(true)
    try {
      await setTarget(selectedCompanyId, selectedRole)
      showToast(`Target set to ${selectedCompany?.name || 'Company'} · ${selectedRole}!`, 'success')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      showToast(err.message || 'Failed to save target. Please try again.', 'danger')
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="onboarding-page-wrapper">
      <PublicNavbar />
      <main className="onboarding-main-container">
        <div className="onboarding-card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#eff6ff',
            color: '#2563eb',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '10px'
          }}>
            <Sparkles size={14} /> Personalize Your Preparation
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 8px',
            letterSpacing: '-0.02em'
          }}>
            Select Your Target Company & Role
          </h1>
          <p style={{
            fontSize: '13.5px',
            color: '#64748b',
            margin: 0,
            lineHeight: 1.5
          }}>
            HireVerse customizes your roadmaps, preparation curriculum, mock assessments, and readiness analytics around your chosen placement goal.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
            Loading companies and roles...
          </div>
        ) : (
          <div>
            {/* Step 1: Select Target Company */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '10px'
              }}>
                1. Choose Target Company
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '4px'
              }}>
                {companies.map(c => {
                  const isSelected = c._id === selectedCompanyId
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => handleCompanySelect(c._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <CompanyMark company={c} size={28} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: isSelected ? '#1d4ed8' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {c.roles?.length || 1} available {c.roles?.length === 1 ? 'role' : 'roles'}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Select Desired Job Role */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '8px'
              }}>
                2. Select Desired Job Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {selectedCompany?.roles?.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Selection Highlight Card */}
            {selectedCompany && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <CompanyMark company={selectedCompany} large />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    Active Preparation Blueprint
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedCompany.name} · <span style={{ color: '#2563eb' }}>{selectedRole}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Unlocks: 4-Phase Roadmap · Role Curriculum · Screening Tests · Readiness Formula
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleStartPreparation}
                disabled={saving || !selectedCompanyId}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '13px 20px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  transition: 'background 0.15s ease'
                }}
              >
                {saving ? 'Setting Up...' : 'Start Preparation'} <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={handleSkip}
                disabled={saving}
                style={{
                  padding: '13px 18px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Explore First
              </button>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}

export default OnboardingPage
