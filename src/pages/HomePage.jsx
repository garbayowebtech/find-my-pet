import { useNavigate } from 'react-router-dom'
import { DB } from '../lib/db'

export default function HomePage({ session }) {
  const navigate = useNavigate()
  const name = session?.user?.user_metadata?.name || 'usuário'

  const handleLogout = async () => {
    await DB.signOut()
  }

  return (
    <div className="home-screen" style={{ position: 'relative' }}>
      <button className="btn-logout-top" onClick={handleLogout}>Sair</button>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🐾</div>
        <h1>Find <span>My Pet</span></h1>
        <p>Olá, <strong>{name.split(' ')[0]}</strong>! O que você quer fazer hoje?</p>
      </div>

      <div className="role-cards">
        <div className="role-card" onClick={() => navigate('/adopt')}>
          <div className="icon">🔍</div>
          <h3>Quero Adotar</h3>
          <p>Encontre seu novo melhor amigo</p>
        </div>
        <div className="role-card" onClick={() => navigate('/donor')}>
          <div className="icon">🏠</div>
          <h3>Quero Colocar para Adoção</h3>
          <p>Cadastre animais e encontre um lar</p>
        </div>
      </div>
    </div>
  )
}
