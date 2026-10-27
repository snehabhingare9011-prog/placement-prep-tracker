import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export function Toast({ message, tone = 'success' }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertTriangle : tone === 'danger' ? AlertCircle : Info

  return (
    <div className={`toast ${tone}`} role="alert">
      <Icon size={18} />
      <span>{message}</span>
    </div>
  )
}

export default Toast
