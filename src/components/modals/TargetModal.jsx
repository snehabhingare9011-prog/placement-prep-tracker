import { useState, useEffect } from 'react'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import CompanyMark from '../common/CompanyMark'
import api from '../../api/client'

export function TargetModal({ close }) {
  const { user, setTarget } = useAuth()
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await api.companies.getAll()
        if (res.success && res.companies) {
          setCompanies(res.companies)
          const currentId = user?.targetCompany?._id || user?.targetCompany || res.companies[0]?._id
          setSelectedCompanyId(currentId)

          const matched = res.companies.find(c => c._id === currentId) || res.companies[0]
          setSelectedRole(user?.currentTargetRole || matched?.roles?.[0] || 'Software Engineer')
        }
      } catch (err) {
        console.error('Failed to load companies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [user])

  const currentSelectedCompany = companies.find(c => c._id === selectedCompanyId) || companies[0]

  const handleCompanyChange = (id) => {
    setSelectedCompanyId(id)
    const next = companies.find(c => c._id === id)
    if (next && next.roles?.length > 0) {
      setSelectedRole(next.roles[0])
    }
  }

  const handleSave = async () => {
    if (!selectedCompanyId) return
    setSaving(true)
    try {
      await setTarget(selectedCompanyId, selectedRole)
      close()
    } catch (err) {
      // Keep modal open so student can fix or retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Change Placement Target" close={close}>
      <p className="modal-copy">
        Your preparation roadmap, curriculum learning topics, and mock assessments will dynamically adapt to this company and role.
      </p>

      {loading ? (
        <div className="skeleton-container" style={{ padding: '20px 0' }}>
          <div className="skeleton-bar" style={{ height: '40px' }} />
          <div className="skeleton-bar" style={{ height: '40px' }} />
        </div>
      ) : (
        <>
          <div className="modal-form-fields">
            <label className="field-label">
              Target Company
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.difficulty})
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Target Role
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {currentSelectedCompany?.roles?.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            {currentSelectedCompany && (
              <div className="goal-preview-box">
                <CompanyMark company={currentSelectedCompany} large />
                <div>
                  <small>Selected Goal</small>
                  <strong>{selectedRole}</strong>
                  <span>at {currentSelectedCompany.name}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={close}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Target Goal'}
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

export default TargetModal
