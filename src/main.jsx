import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import ResetPasswordView from './pages/ResetPasswordView'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// Lazy-loaded — pulls in Recharts (the Insights dashboard), which nearly
// doubles bundle size. Splitting it into its own chunk means the 500
// scouts using the mission board never download it; only whoever actually
// visits #admin does.
const AdminGate = lazy(() => import('./components/admin/AdminGate'))

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function Root() {
  // #admin is a separate, unlinked entry point gated by Supabase Auth
  // (see AdminGate) — entirely independent of the scouts' custom auth.
  if (window.location.hash === '#admin') {
    return (
      <ThemeProvider>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-scout-bg" />}>
          <AdminGate />
        </Suspense>
      </ThemeProvider>
    )
  }

  // #reset-password?token=... — the emailed password-reset link lands here,
  // entirely outside the normal scout app tree.
  if (window.location.hash.startsWith('#reset-password')) {
    const query = window.location.hash.split('?')[1] || ''
    const token = new URLSearchParams(query).get('token')
    return <ThemeProvider><ResetPasswordView token={token} /></ThemeProvider>
  }

  const inner = (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  )

  if (GOOGLE_CLIENT_ID) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{inner}</GoogleOAuthProvider>
  }
  return inner
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
