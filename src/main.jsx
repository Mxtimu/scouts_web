import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import AdminGate from './components/admin/AdminGate'
import ResetPasswordView from './pages/ResetPasswordView'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function Root() {
  // #admin is a separate, unlinked entry point gated by Supabase Auth
  // (see AdminGate) — entirely independent of the scouts' custom auth.
  if (window.location.hash === '#admin') {
    return <ThemeProvider><AdminGate /></ThemeProvider>
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
