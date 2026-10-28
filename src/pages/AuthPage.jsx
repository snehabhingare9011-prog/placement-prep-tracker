import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Lock, Mail, Compass } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PublicNavbar from '../components/layout/PublicNavbar'

export function AuthPage({ initialMode = 'login' }) {
  const location = useLocation()
  const navigate = useNavigate()

  const [mode, setMode] = useState(() => {
    if (location.pathname === '/register') return 'register'
    if (location.pathname === '/login') return 'login'
    return initialMode
  })

  // Synchronize mode when route path changes & clear stale errors
  useEffect(() => {
    setError('')
    setSuccessMsg('')
    setFieldErrors({})
    if (location.pathname === '/register') {
      setMode('register')
    } else if (location.pathname === '/login') {
      setMode('login')
    } else if (initialMode) {
      setMode(initialMode)
    }
  }, [location.pathname, initialMode])

  const { login, register } = useAuth()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [college, setCollege] = useState('Apex Institute of Technology')
  const [degree, setDegree] = useState('B.Tech')
  const [branch, setBranch] = useState('Computer Engineering')
  const [graduationYear, setGraduationYear] = useState('2026')
  const [cgpa, setCgpa] = useState('8.4')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Helper to handle field updates and clear field-specific errors
  const updateField = (setter, fieldName) => (e) => {
    setter(e.target.value)
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
    if (error) setError('')
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccessMsg('')
    setFieldErrors({})

    if (newMode === 'login' && location.pathname !== '/login') {
      navigate('/login', { replace: true })
    } else if (newMode === 'register' && location.pathname !== '/register') {
      navigate('/register', { replace: true })
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const errors = {}
    const trimmedEmail = email.trim()
    const emailRegex = /^\S+@\S+\.\S+$/

    if (!trimmedEmail) {
      errors.email = 'Please enter your email.'
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email.'
    }

    if (!password) {
      errors.password = 'Please enter your password.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const user = await login(trimmedEmail, password)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'placement_officer' || user.role === 'faculty') navigate('/placement-portal')
      else if (!user.targetCompany) navigate('/onboarding')
      else navigate('/dashboard')
    } catch (err) {
      if (err.isNetworkError || (err.status && err.status >= 500)) {
        setError('Something went wrong. Please try again.')
      } else if (err.status === 429) {
        setError('Too many attempts. Please try again later.')
      } else if (err.status === 401) {
        setError('Invalid email or password.')
      } else if (err.status === 404) {
        setError('No account found. Please create an account.')
      } else if (err.status === 403) {
        setError(err.message || 'Your account is deactivated.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    const errors = {}
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const emailRegex = /^\S+@\S+\.\S+$/

    if (!trimmedName) {
      errors.name = 'Please enter your full name.'
    }
    if (!trimmedEmail) {
      errors.email = 'Please enter your email.'
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email.'
    }
    if (!password) {
      errors.password = 'Please enter your password.'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.'
    }
    if (!college.trim()) {
      errors.college = 'Please enter your college.'
    }
    if (!branch.trim()) {
      errors.branch = 'Please enter your branch.'
    }
    if (!graduationYear || Number(graduationYear) < 2015 || Number(graduationYear) > 2035) {
      errors.graduationYear = 'Please enter a valid graduation year.'
    }
    if (cgpa === '' || isNaN(Number(cgpa)) || Number(cgpa) < 0 || Number(cgpa) > 10) {
      errors.cgpa = 'Please enter a valid CGPA (0 - 10).'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('')
      return
    }

    setFieldErrors({})
    setLoading(true)

    try {
      const user = await register({
        name: trimmedName,
        email: trimmedEmail,
        password,
        college: college.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        graduationYear: Number(graduationYear),
        cgpa: Number(cgpa)
      })
      if (!user?.targetCompany) navigate('/onboarding')
      else navigate('/dashboard')
    } catch (err) {
      if (err.isNetworkError || (err.status && err.status >= 500)) {
        setError('Something went wrong. Please try again.')
      } else if (err.status === 409 || err.code === 'EMAIL_ALREADY_REGISTERED' || err.message?.toLowerCase().includes('already exist')) {
        setError('') // Crucial: Do not duplicate in top alert
        setFieldErrors({ email: 'This email is already registered. Please sign in.' })
      } else if (err.status === 429) {
        setError('Too many attempts. Please try again later.')
      } else {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <PublicNavbar />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <Link to="/" className="auth-brand-logo" aria-label="HireVerse Home">
              <div className="auth-brand-icon">
                <Compass size={22} />
              </div>
              <div className="auth-brand-title">
                <strong>Hire<span>Verse</span></strong>
              </div>
            </Link>
            <p className="auth-brand-subtitle">Company-Wise Placement Preparation &amp; Interview Readiness</p>
          </div>

          {error && <div className="auth-alert danger" role="alert">{error}</div>}
          {successMsg && <div className="auth-alert success" role="status">{successMsg}</div>}

          {mode === 'login' && (
            <div className="auth-header-title">
              <h2>Sign In</h2>
              <p>Enter your credentials to access your account</p>
            </div>
          )}

          {mode === 'register' && (
            <div className="auth-header-title">
              <h2>Create Account</h2>
              <p>Fill in your details to create your account</p>
            </div>
          )}

          {mode === 'login' && (
            <form
              id="panel-login"
              onSubmit={handleLoginSubmit}
              className="auth-form"
              noValidate
            >
              <label className="field-label">
                <span>Email Address</span>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={updateField(setEmail, 'email')}
                    className={fieldErrors.email ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'error-login-email' : undefined}
                  />
                </div>
                {fieldErrors.email && (
                  <span id="error-login-email" className="field-error" role="alert">
                    {fieldErrors.email}
                  </span>
                )}
              </label>

              <label className="field-label">
                <span>Password</span>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={updateField(setPassword, 'password')}
                    className={fieldErrors.password ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'error-login-password' : undefined}
                  />
                </div>
                {fieldErrors.password && (
                  <span id="error-login-password" className="field-error" role="alert">
                    {fieldErrors.password}
                  </span>
                )}
              </label>

              <button type="submit" className="button auth-submit-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} />
              </button>

              <div className="auth-switch-prompt">
                <span>Don't have an account?</span>{' '}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => switchMode('register')}
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form
              id="panel-register"
              onSubmit={handleRegisterSubmit}
              className="auth-form"
              noValidate
            >
              <label className="field-label">
                <span>Full Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Sharma"
                  value={name}
                  onChange={updateField(setName, 'name')}
                  className={fieldErrors.name ? 'input-error' : ''}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'error-reg-name' : undefined}
                />
                {fieldErrors.name && (
                  <span id="error-reg-name" className="field-error" role="alert">
                    {fieldErrors.name}
                  </span>
                )}
              </label>

              <div className="form-grid-two">
                <label className="field-label">
                  <span>Email Address</span>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={updateField(setEmail, 'email')}
                    className={fieldErrors.email ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'error-reg-email' : undefined}
                  />
                  {fieldErrors.email && (
                    <span id="error-reg-email" className="field-error" role="alert">
                      {fieldErrors.email}
                    </span>
                  )}
                </label>

                <label className="field-label">
                  <span>Password</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 chars"
                    value={password}
                    onChange={updateField(setPassword, 'password')}
                    className={fieldErrors.password ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'error-reg-password' : undefined}
                  />
                  {fieldErrors.password && (
                    <span id="error-reg-password" className="field-error" role="alert">
                      {fieldErrors.password}
                    </span>
                  )}
                </label>
              </div>

              <div className="form-grid-two">
                <label className="field-label">
                  <span>College / University / Institute</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Institute of Technology"
                    value={college}
                    onChange={updateField(setCollege, 'college')}
                    className={fieldErrors.college ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.college)}
                    aria-describedby={fieldErrors.college ? 'error-reg-college' : undefined}
                  />
                  {fieldErrors.college && (
                    <span id="error-reg-college" className="field-error" role="alert">
                      {fieldErrors.college}
                    </span>
                  )}
                </label>

                <label className="field-label">
                  <span>Branch / Specialization</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science or Engineering"
                    value={branch}
                    onChange={updateField(setBranch, 'branch')}
                    className={fieldErrors.branch ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.branch)}
                    aria-describedby={fieldErrors.branch ? 'error-reg-branch' : undefined}
                  />
                  {fieldErrors.branch && (
                    <span id="error-reg-branch" className="field-error" role="alert">
                      {fieldErrors.branch}
                    </span>
                  )}
                </label>
              </div>

              <div className="form-grid-two">
                <label className="field-label">
                  <span>Graduation Year</span>
                  <input
                    type="number"
                    required
                    min={2015}
                    max={2035}
                    value={graduationYear}
                    onChange={updateField(setGraduationYear, 'graduationYear')}
                    className={fieldErrors.graduationYear ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.graduationYear)}
                    aria-describedby={fieldErrors.graduationYear ? 'error-reg-gradYear' : undefined}
                  />
                  {fieldErrors.graduationYear && (
                    <span id="error-reg-gradYear" className="field-error" role="alert">
                      {fieldErrors.graduationYear}
                    </span>
                  )}
                </label>

                <label className="field-label">
                  <span>Current CGPA / Grade (Scale 10)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={updateField(setCgpa, 'cgpa')}
                    className={fieldErrors.cgpa ? 'input-error' : ''}
                    aria-invalid={Boolean(fieldErrors.cgpa)}
                    aria-describedby={fieldErrors.cgpa ? 'error-reg-cgpa' : undefined}
                  />
                  {fieldErrors.cgpa && (
                    <span id="error-reg-cgpa" className="field-error" role="alert">
                      {fieldErrors.cgpa}
                    </span>
                  )}
                </label>
              </div>

              <button type="submit" className="button auth-submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={16} />
              </button>

              <div className="auth-switch-prompt">
                <span>Already have an account?</span>{' '}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => switchMode('login')}
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthPage
