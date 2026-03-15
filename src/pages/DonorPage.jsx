import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB } from '../lib/db'

const MAX_ANIMALS = 5

export default function DonorPage({ session }) {
  const navigate = useNavigate()
  const userId = session.user.id
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAnimals() }, [])

  const loadAnimals = async () => {
    setLoading(true)
    try {
      const data = await DB.getMyAnimals(userId)
      setAnimals(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este animal?')) return
    try {
      await DB.deleteAnimal(id)
      setAnimals(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const getMainPhoto = (animal) => {
    const photos = animal.animal_photos || []
    const sorted = [...photos].sort((a, b) => a.order - b.order)
    return sorted[0]?.url || null
  }

  const canAdd = animals.length < MAX_ANIMALS

  return (
    <div className="donor-screen">
      <div className="donor-header">
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }} onClick={() => navigate('/')}>← Voltar</button>
        <h2>🏠 Meus Animais</h2>
        <div style={{ width: 64 }} />
      </div>

      <div className="donor-content">
        <div className="limit-bar">
          <span>Animais cadastrados</span>
          <strong>{animals.length} / {MAX_ANIMALS}</strong>
        </div>

        {loading ? (
          <p className="text-muted text-center" style={{ padding: '3rem 0' }}>Carregando...</p>
        ) : (
          <div className="animal-card-list">
            {animals.map(animal => (
              <div className="animal-list-item" key={animal.id}>
                {getMainPhoto(animal)
                  ? <img src={getMainPhoto(animal)} alt={animal.name} className="animal-list-thumb" />
                  : <div className="animal-list-thumb">{animal.species === 'cachorro' ? '🐕' : '🐈'}</div>
                }
                <div className="animal-list-info">
                  <h4>{animal.name}</h4>
                  <p>{animal.species} · {animal.breed} · {animal.size}</p>
                </div>
                <div className="animal-list-actions">
                  <button className="btn btn-outline" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }} onClick={() => navigate(`/donor/edit/${animal.id}`)}>✏</button>
                  <button className="btn btn-outline" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem', borderColor: 'var(--c-danger)', color: 'var(--c-danger)' }} onClick={() => handleDelete(animal.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {canAdd ? (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/donor/new')}>
            + Cadastrar novo animal
          </button>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--c-text-muted)', border: '1px dashed var(--c-border)', borderRadius: 'var(--radius-md)' }}>
            Limite atingido. <strong style={{ color: 'var(--c-primary)' }}>Plano Premium</strong> — em breve!
          </div>
        )}
      </div>
    </div>
  )
}
