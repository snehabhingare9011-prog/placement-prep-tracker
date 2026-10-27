import { useState } from 'react'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Download,
  Building2,
  Check,
  XCircle,
  HelpCircle
} from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import CompanyMark from '../components/common/CompanyMark'
import { useAuth } from '../context/AuthContext'

const SAMPLE_COMPANIES = [
  { name: 'Accenture', role: 'Associate Software Engineer', defaultScore: 84 },
  { name: 'Google', role: 'Software Engineer', defaultScore: 72 },
  { name: 'Amazon', role: 'Software Development Engineer', defaultScore: 78 },
  { name: 'Microsoft', role: 'Full Stack Developer', defaultScore: 86 },
  { name: 'Tata Consultancy Services', role: 'Digital Profile', defaultScore: 91 }
]

export function ResumeAnalyzerPage() {
  const { user, showToast } = useAuth()
  const [selectedCompany, setSelectedCompany] = useState(SAMPLE_COMPANIES[0].name)
  const [selectedRole, setSelectedRole] = useState(SAMPLE_COMPANIES[0].role)
  const [uploadedFileName, setUploadedFileName] = useState('Arjun_Patel_Resume_2026.pdf')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(true)

  const activeCompany = SAMPLE_COMPANIES.find(c => c.name === selectedCompany) || SAMPLE_COMPANIES[0]

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFileName(file.name)
      triggerAnalysis(file.name)
    }
  }

  const triggerAnalysis = (fileName = uploadedFileName) => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setHasAnalyzed(true)
      showToast(`Resume "${fileName}" successfully analyzed against ${selectedCompany} requirements!`, 'success')
    }, 900)
  }

  return (
    <div className="resume-analyzer-page">
      <PageHeader
        eyebrow="AI-POWERED RESUME AUDIT & ATS MATCHER"
        title="Resume ATS Score & Keyword Gap Analyzer"
        description="Upload your resume to evaluate keyword match percentage, ATS parsing compatibility, and company-specific requirements before applying."
      />

      {/* Configuration & Upload Grid */}
      <div className="resume-top-grid">
        {/* Upload Dropzone */}
        <section className="resume-upload-card">
          <div className="upload-header">
            <UploadCloud size={28} className="upload-icon" />
            <div>
              <h3>Upload Your Resume</h3>
              <span>Supports PDF, DOCX, or TXT (Max 5MB)</span>
            </div>
          </div>

          <label className="resume-dropzone">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden-file-input"
            />
            <FileText size={36} className="file-icon" />
            <p><strong>Click to browse</strong> or drag and drop your resume file</p>
            <span className="file-status-text">
              Active File: <b>{uploadedFileName}</b>
            </span>
          </label>

          <div className="upload-actions">
            <button
              type="button"
              className="button primary"
              onClick={() => triggerAnalysis()}
              disabled={isAnalyzing}
            >
              <RefreshCw size={15} className={isAnalyzing ? 'spin-icon' : ''} />
              <span>{isAnalyzing ? 'Analyzing ATS Parser...' : 'Run ATS Audit'}</span>
            </button>
          </div>
        </section>

        {/* Target Profile Selector */}
        <section className="resume-target-card">
          <h3>Target Evaluation Context</h3>
          <p>ATS matching algorithms score keyword density based on the company's job description.</p>

          <div className="resume-field-group">
            <label>Target Company:</label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                const comp = SAMPLE_COMPANIES.find(c => c.name === e.target.value)
                setSelectedCompany(e.target.value)
                if (comp) setSelectedRole(comp.role)
              }}
              className="resume-select"
            >
              {SAMPLE_COMPANIES.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="resume-field-group">
            <label>Target Job Role:</label>
            <input
              type="text"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="resume-input"
            />
          </div>

          <div className="ats-notice-box">
            <Sparkles size={16} />
            <span>Scanning 40+ engineering keywords relevant to {selectedCompany}'s screening algorithm.</span>
          </div>
        </section>
      </div>

      {/* Analysis Results View */}
      {hasAnalyzed && (
        <div className="resume-results-section">
          {/* Main Score Banner */}
          <section className="ats-score-banner">
            <div className="score-radial-container">
              <div className="score-radial-circle">
                <span className="score-value">{activeCompany.defaultScore}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="score-radial-label">
                <strong>ATS Compatibility Score</strong>
                <span className="status-high">Above 80% threshold · High Interview Call Likelihood</span>
              </div>
            </div>

            <div className="score-summary-stats">
              <div className="stat-box">
                <span>Matched Skills</span>
                <strong className="text-green">14 Keywords</strong>
              </div>
              <div className="stat-box">
                <span>Missing Skills</span>
                <strong className="text-orange">4 Keywords</strong>
              </div>
              <div className="stat-box">
                <span>Formatting Score</span>
                <strong className="text-blue">94% Clean</strong>
              </div>
            </div>
          </section>

          {/* Keywords Match & Gap Grid */}
          <div className="keywords-comparison-grid">
            {/* Matched Keywords */}
            <article className="keywords-panel matched-panel">
              <div className="panel-title-row">
                <CheckCircle2 size={18} className="text-green" />
                <h4>Matched Job Keywords ({selectedCompany})</h4>
              </div>
              <p>These crucial keywords were successfully parsed from your experience and project sections:</p>
              <div className="skills-pill-wrap">
                {['React.js', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'JavaScript (ES6+)', 'Git & GitHub', 'Data Structures', 'SQL / PostgreSQL', 'Object-Oriented Programming', 'Agile Methodologies', 'Problem Solving'].map(skill => (
                  <span key={skill} className="skill-pill-matched">
                    <Check size={12} /> {skill}
                  </span>
                ))}
              </div>
            </article>

            {/* Missing Keywords */}
            <article className="keywords-panel missing-panel">
              <div className="panel-title-row">
                <AlertTriangle size={18} className="text-orange" />
                <h4>High-Impact Missing Keywords</h4>
              </div>
              <p>Adding these keywords to your projects will boost your ATS score to 90%+:</p>
              <div className="skills-pill-wrap">
                {[
                  { name: 'Redis Caching', impact: '+4 pts' },
                  { name: 'CI/CD Pipelines (GitHub Actions)', impact: '+5 pts' },
                  { name: 'Unit Testing (Jest / Vitest)', impact: '+4 pts' },
                  { name: 'Docker Containerization', impact: '+3 pts' }
                ].map(item => (
                  <span key={item.name} className="skill-pill-missing">
                    <span>{item.name}</span>
                    <small>{item.impact}</small>
                  </span>
                ))}
              </div>
            </article>
          </div>

          {/* Section-by-Section ATS Audit */}
          <div className="section-audit-grid">
            <div className="audit-card pass">
              <div className="audit-icon pass-icon"><CheckCircle2 size={18} /></div>
              <div className="audit-text">
                <strong>Contact Information & Links</strong>
                <span>Professional email, phone number, LinkedIn URL, and active GitHub profile detected.</span>
              </div>
            </div>

            <div className="audit-card warning">
              <div className="audit-icon warn-icon"><AlertTriangle size={18} /></div>
              <div className="audit-text">
                <strong>Quantified Impact Metrics</strong>
                <span>Some project bullet points lack measurable metrics. Add numbers: e.g. "Reduced API latency by 40%".</span>
              </div>
            </div>

            <div className="audit-card pass">
              <div className="audit-icon pass-icon"><CheckCircle2 size={18} /></div>
              <div className="audit-text">
                <strong>ATS Parsing Layout</strong>
                <span>Standard single-column format with parseable headings. No nested tables or icons blocking scanner bots.</span>
              </div>
            </div>

            <div className="audit-card pass">
              <div className="audit-icon pass-icon"><CheckCircle2 size={18} /></div>
              <div className="audit-text">
                <strong>Action Verb Strength</strong>
                <span>Strong engineering action verbs used: "Architected", "Engineered", "Implemented", "Optimized".</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeAnalyzerPage
