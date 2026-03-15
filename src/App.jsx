import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/db'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import AdoptPage from './pages/AdoptPage'
import DonorPage from './pages/DonorPage'
import AnimalFormPage from './pages/AnimalFormPage'
import './index.css'

function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '2rem', color: 'var(--c-text-muted)' }}>
        🐾
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/" replace />} />
        <Route path="/" element={session ? <HomePage session={session} /> : <Navigate to="/auth" replace />} />
        <Route path="/adopt" element={session ? <AdoptPage session={session} /> : <Navigate to="/auth" replace />} />
        <Route path="/donor" element={session ? <DonorPage session={session} /> : <Navigate to="/auth" replace />} />
        <Route path="/donor/new" element={session ? <AnimalFormPage session={session} /> : <Navigate to="/auth" replace />} />
        <Route path="/donor/edit/:id" element={session ? <AnimalFormPage session={session} /> : <Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
