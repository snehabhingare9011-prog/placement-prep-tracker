import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { TargetModal } from '../modals/TargetModal'
import { ProfileModal } from '../modals/ProfileModal'
import { Toast } from '../common/Toast'
import { useAuth } from '../../context/AuthContext'

export function AppLayout() {
  const { toast } = useAuth()
  const [targetModalOpen, setTargetModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="app">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        closeMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="app-main">
        <Topbar
          onOpenTarget={() => setTargetModalOpen(true)}
          onOpenProfile={() => setProfileModalOpen(true)}
          onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="content">
          <Outlet context={{ onOpenTarget: () => setTargetModalOpen(true) }} />
        </main>
      </div>

      {targetModalOpen && (
        <TargetModal close={() => setTargetModalOpen(false)} />
      )}

      {profileModalOpen && (
        <ProfileModal close={() => setProfileModalOpen(false)} />
      )}

      {toast && <Toast message={toast.message} tone={toast.tone} />}
    </div>
  )
}

export default AppLayout
