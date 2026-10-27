import { useState } from 'react'
import { Modal } from '../common/Modal'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

export function ProfileModal({ close }) {
  const { user, refreshUser, showToast } = useAuth()
  const [tab, setTab] = useState('profile') // 'profile' | 'security'

  // Profile Form state
  const [name, setName] = useState(user?.name || '')
  const [college, setCollege] = useState(user?.college || '')
  const [degree, setDegree] = useState(user?.degree || '')
  const [branch, setBranch] = useState(user?.branch || '')
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || 2026)
  const [cgpa, setCgpa] = useState(user?.cgpa || 8.0)
  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '))
  const [saving, setSaving] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean)
      const res = await api.users.updateProfile({
        name,
        college,
        degree,
        branch,
        graduationYear: Number(graduationYear),
        cgpa: Number(cgpa),
        skills
      })
      if (res.success) {
        await refreshUser()
        showToast('Profile details updated successfully.', 'success')
        close()
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'warning')
      return
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning')
      return
    }

    setPasswordSaving(true)
    try {
      const res = await api.users.updatePassword({ currentPassword, newPassword })
      if (res.success) {
        showToast('Password changed successfully.', 'success')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTab('profile')
      }
    } catch (err) {
      showToast(err.message, 'danger')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <Modal title="Account Profile & Settings" close={close} maxWidth="600px">
      <div className="modal-tabs">
        <button
          type="button"
          className={`modal-tab ${tab === 'profile' ? 'active' : ''}`}
          onClick={() => setTab('profile')}
        >
          Academic Details
        </button>
        <button
          type="button"
          className={`modal-tab ${tab === 'security' ? 'active' : ''}`}
          onClick={() => setTab('security')}
        >
          Security & Password
        </button>
      </div>

      {tab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} className="modal-form-fields">
          <div className="form-grid-two">
            <label className="field-label">
              Full Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="field-label">
              Email Address
              <input
                type="email"
                disabled
                value={user?.email || ''}
                title="Email address cannot be modified directly"
              />
            </label>
          </div>

          <div className="form-grid-two">
            <label className="field-label">
              College / University
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </label>

            <label className="field-label">
              Degree & Program
              <input
                type="text"
                required
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
              />
            </label>
          </div>

          <div className="form-grid-three">
            <label className="field-label">
              Branch
              <input
                type="text"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </label>

            <label className="field-label">
              Graduation Year
              <input
                type="number"
                required
                min={2024}
                max={2030}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              />
            </label>

            <label className="field-label">
              CGPA (Scale 10)
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
              />
            </label>
          </div>

          <label className="field-label">
            Technical Skills (comma-separated)
            <input
              type="text"
              placeholder="e.g. JavaScript, React, Node.js, SQL, DSA"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={close}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="modal-form-fields">
          <label className="field-label">
            Current Password
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </label>

          <label className="field-label">
            New Password
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          <label className="field-label">
            Confirm New Password
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setTab('profile')}
              disabled={passwordSaving}
            >
              Back
            </button>
            <button type="submit" className="button" disabled={passwordSaving}>
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default ProfileModal
