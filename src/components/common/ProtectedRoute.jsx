import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SkeletonLoader from './SkeletonLoader'

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <SkeletonLoader rows={5} height={60} />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
