import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, UserCheck, ArrowRight, Lock, Mail, User, GraduationCap, Building } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

export function AuthPage({ initialMode = 'login' }) {
  const [searchParams] = useSearchParams()
  const modeParam = searchParams.get('mode')
  const [mode, setMode] = useState(modeParam || initialMode) // 'login' | 'register' | 'forgot' | 'reset'

  const { login, register, showToast } = useAuth()
  const navigate = useNavigate()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [college, setCollege] = useState('Apex Institute of Technology')
  const [degree, setDegree] = useState('B.Tech')
  const [branch, setBranch] = useState('Computer Engineering')
  const [graduationYear, setGraduationYear] = useState('2026')
  const [cgpa, setCgpa] = useState('8.4')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Quick fill helper for demonstration
  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'placement_officer' || user.role === 'faculty') navigate('/placement-portal')
      else if (!user.targetCompany) navigate('/onboarding')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register({
        name,
        email,
        password,
        college,
        degree,
        branch,
        graduationYear: Number(graduationYear),
        cgpa: Number(cgpa)
      })
      if (!user?.targetCompany) navigate('/onboarding')
      else navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.forgotPassword(email)
      setSuccessMsg(res.message)
      if (res.resetToken) {
        setResetToken(res.resetToken)
        setMode('reset')
      }
    } catch (err) {
      setError(err.message || 'Failed to request reset token.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.resetPassword(resetToken, newPassword)
      showToast(res.message, 'success')
      setMode('login')
      setPassword(newPassword)
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <Link to="/" className="brand">
            <span className="brand-mark">H</span>
            <span>Hire<span>Verse</span></span>
          </Link>
          <p>Company-Wise Placement Preparation & Interview Readiness Platform</p>
        </div>

        {error && <div className="auth-alert danger">{error}</div>}
        {successMsg && <div className="auth-alert success">{successMsg}</div>}

        {mode === 'login' && (
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError('') }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setError('') }}
              >
                Register as Student
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <label className="field-label">
                <span>Email Address</span>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    required
                    placeholder="student@hireverse.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </label>

              <label className="field-label">
                <div className="field-label-row">
                  <span>Password</span>
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => { setMode('forgot'); setError('') }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </label>

              <button type="submit" className="button auth-submit-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In to Workspace'} <ArrowRight size={16} />
              </button>
            </form>

            {/* Demo Quick Fill Badges for Evaluators */}
            <div className="demo-accounts-panel">
              <p>Demo accounts for testing & demonstration:</p>
              <div className="demo-chips">
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickFill('student@hireverse.dev', 'Student@123')}
                >
                  <User size={13} /> Student (Arjun)
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickFill('placement@hireverse.dev', 'Officer@123')}
                >
                  <GraduationCap size={13} /> Placement Officer
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickFill('faculty@hireverse.dev', 'Faculty@123')}
                >
                  <Building size={13} /> Faculty Mentor
                </button>
                <button
                  type="button"
                  className="demo-chip"
                  onClick={() => handleQuickFill('admin@hireverse.dev', 'Admin@123')}
                >
                  <ShieldCheck size={13} /> System Admin
                </button>
              </div>
            </div>
          </>
        )}

        {mode === 'register' && (
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setError('') }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setError('') }}
              >
                Register as Student
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <label className="field-label">
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <div className="form-grid-two">
                <label className="field-label">
                  <span>Email Address</span>
                  <input
                    type="email"
                    required
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label className="field-label">
                  <span>Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-grid-two">
                <label className="field-label">
                  <span>College / Institute</span>
                  <input
                    type="text"
                    required
                    placeholder="College Name"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </label>

                <label className="field-label">
                  <span>Branch</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Engineering"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-grid-two">
                <label className="field-label">
                  <span>Graduation Year</span>
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
                  <span>Current CGPA (Scale 10)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                  />
                </label>
              </div>

              <button type="submit" className="button auth-submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={16} />
              </button>
            </form>
          </>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="auth-form">
            <h2>Account Recovery</h2>
            <p className="modal-copy">
              Enter your registered email address. We will generate a secure recovery token to reset your password.
            </p>

            <label className="field-label">
              <span>Account Email</span>
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setMode('login')}
              >
                Back to Sign In
              </button>
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Processing...' : 'Send Recovery Token'}
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="auth-form">
            <h2>Reset Password</h2>
            <p className="modal-copy">Enter the reset token and choose a new password.</p>

            <label className="field-label">
              <span>Reset Token</span>
              <input
                type="text"
                required
                placeholder="Paste token here"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
            </label>

            <label className="field-label">
              <span>New Password</span>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setMode('login')}
              >
                Cancel
              </button>
              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AuthPage
