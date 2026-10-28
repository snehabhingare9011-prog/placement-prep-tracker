import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import CompaniesPage from './pages/CompaniesPage'
import CompanyGuidePage from './pages/CompanyGuidePage'
import CompanyLearningPage from './pages/CompanyLearningPage'
import MockTestsPage from './pages/MockTestsPage'
import MockExamPage from './pages/MockExamPage'
import MockResultPage from './pages/MockResultPage'
import RoadmapPage from './pages/RoadmapPage'
import ReadinessPage from './pages/ReadinessPage'
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage'
import AiInterviewPage from './pages/AiInterviewPage'
import PlacementDrivesPage from './pages/PlacementDrivesPage'
import PlacementPortalPage from './pages/PlacementPortalPage'
import AdminPage from './pages/AdminPage'

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Authenticated Application Shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/:id" element={<CompanyGuidePage />} />
            <Route path="/company-prep" element={<CompanyLearningPage />} />
            <Route path="/mock-tests" element={<MockTestsPage />} />
            <Route path="/mock-exam/:attemptId" element={<MockExamPage />} />
            <Route path="/mock-result/:attemptId" element={<MockResultPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/readiness" element={<ReadinessPage />} />
            <Route path="/analytics" element={<Navigate to="/readiness" replace />} />
            <Route path="/practice" element={<Navigate to="/company-prep" replace />} />
            <Route path="/placement-drives" element={<PlacementDrivesPage />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
            <Route path="/ai-interview" element={<AiInterviewPage />} />

            {/* Placement Officer & Faculty Portal */}
            <Route
              path="/placement-portal"
              element={
                <ProtectedRoute allowedRoles={['admin', 'faculty', 'placement_officer']}>
                  <PlacementPortalPage />
                </ProtectedRoute>
              }
            />

            {/* System Administrator Workspace */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
