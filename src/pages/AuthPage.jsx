import { useState } from 'react'
import { DB } from '../lib/db'

const ROLES = [
  { value: 'adopter', label: '🐾 Quero Adotar', desc: 'Encontrar um amigo pra chamar de seu' },
  { value: 'donor', label: '🏠 Quero Colocar para Adoção', desc: 'Encontrar um lar amoroso para um animal' },
]

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('adopter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try {
      await DB.signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setLoading(true)
    try {
      await DB.signUp(email, password, { name, phone, role })
      setInfo('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(''); setLoading(true)
    try {
      await DB.signInWithGoogle()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="auth-logo">🐾</div>
          <h1>Find <span>My Pet</span></h1>
          <p className="subtitle">Conectando corações e patinhas</p>
        </div>

        <div className="auth-tabs">
          <div className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Entrar</div>
          <div className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Cadastrar</div>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>E-mail</label>
              <input className="form-control" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input className="form-control" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" minLength={6} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? '...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Nome completo</label>
              <input className="form-control" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Silva" />
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input className="form-control" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seuemail@exemplo.com" />
            </div>
            <div className="form-group">
              <label>Telefone (WhatsApp)</label>
              <input className="form-control" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(21) 99999-9999" />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input className="form-control" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" minLength={6} />
            </div>
            <div className="form-group">
              <label>Meu objetivo é...</label>
              <div className="radio-group">
                {ROLES.map(r => (
                  <div key={r.value} className={`radio-pill ${role === r.value ? 'selected' : ''}`} onClick={() => setRole(r.value)}>
                    {r.label}
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            {info && <p className="success-msg">{info}</p>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? '...' : 'Criar conta'}
            </button>
          </form>
        )}

        <div className="oauth-divider">ou</div>
        <button className="btn btn-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Entrar com o Google
        </button>
      </div>
    </div>
  )
}
