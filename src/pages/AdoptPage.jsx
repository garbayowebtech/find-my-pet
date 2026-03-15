import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TinderCard from 'react-tinder-card'
import { DB } from '../lib/db'

const SPECIES_EMOJI = { cachorro: '🐕', gato: '🐈' }
const BREEDS_DOG = ['SRD (Vira-lata)', 'Labrador', 'Golden Retriever', 'Bulldog', 'Poodle', 'Beagle', 'Shih Tzu', 'Pinscher', 'Lhasa Apso', 'Yorkshire', 'Dachshund', 'Border Collie', 'Pastor Alemão', 'Rottweiler', 'Husky Siberiano', 'Outra']
const BREEDS_CAT = ['SRD (Vira-lata)', 'Persa', 'Siamês', 'Maine Coon', 'Angorá', 'Bengal', 'Ragdoll', 'British Shorthair', 'Scottish Fold', 'Sphynx', 'Outra']
const DEFAULT_FILTERS = { species: '', breed: '', sex: '', size: '', age: '', ok_children: '', ok_animals: '' }

export default function AdoptPage({ session }) {
  const navigate = useNavigate()
  const userId = session.user.id

  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [match, setMatch] = useState(null) // animal object on match
  const [cardIndex, setCardIndex] = useState(0)
  const currentCardRef = useRef(null)

  useEffect(() => {
    loadAnimals()
  }, [filters])

  const loadAnimals = async () => {
    setLoading(true)
    try {
      const all = await DB.getAnimalsForAdoption(filters)
      const swiped = await DB.getSwipedAnimalIds(userId)
      const swipedSet = new Set(swiped)
      const unseen = all.filter(a => !swipedSet.has(a.id) && a.owner_id !== userId)
      setAnimals(unseen.reverse()) // react-tinder-card renders last = top
      setCardIndex(unseen.length - 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onSwipe = async (direction, animal) => {
    const action = direction === 'left' ? 'like' : 'skip'
    try {
      await DB.recordSwipe(userId, animal.id, action)
    } catch (err) {
      console.error(err)
    }
    if (action === 'like') {
      setMatch(animal)
    }
    setCardIndex(prev => prev - 1)
  }

  const swipe = (dir) => {
    if (currentCardRef.current) currentCardRef.current.swipe(dir)
  }

  const getMainPhoto = (animal) => {
    const photos = animal.animal_photos || []
    const sorted = [...photos].sort((a, b) => a.order - b.order)
    return sorted[0]?.url || null
  }

  const FilterChip = ({ field, value, label }) => (
    <button
      className={`filter-chip ${filters[field] === value ? 'active' : ''}`}
      onClick={() => setFilters(f => ({ ...f, [field]: f[field] === value ? '' : value }))}
    >
      {label}
    </button>
  )

  return (
    <div className="adopt-screen">
      <div className="adopt-header">
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }} onClick={() => navigate('/')}>← Voltar</button>
        <h2>🐾 Encontre um amigo</h2>
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }} onClick={() => setShowFilters(true)}>⚙ Filtros</button>
      </div>

      {/* Quick filter chips */}
      <div className="filter-bar">
        <FilterChip field="species" value="cachorro" label="🐕 Cães" />
        <FilterChip field="species" value="gato" label="🐈 Gatos" />
        <FilterChip field="sex" value="M" label="♂ Macho" />
        <FilterChip field="sex" value="F" label="♀ Fêmea" />
        <FilterChip field="size" value="pequeno" label="Pequeno" />
        <FilterChip field="size" value="médio" label="Médio" />
        <FilterChip field="size" value="grande" label="Grande" />
      </div>

      <div className="swipe-area">
        {loading ? (
          <div className="swipe-empty"><div className="icon">🐾</div><p>Carregando...</p></div>
        ) : animals.length === 0 ? (
          <div className="swipe-empty">
            <div className="icon">🎉</div>
            <p>Você viu todos os animais disponíveis!</p>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={loadAnimals}>Recarregar</button>
          </div>
        ) : (
          <div className="card-stack">
            {animals.map((animal, i) => (
              <div className="swipe-card-wrapper" key={animal.id}>
                <TinderCard
                  ref={i === cardIndex ? currentCardRef : null}
                  onSwipe={(dir) => onSwipe(dir, animal)}
                  preventSwipe={['up', 'down']}
                  swipeThreshold={80}
                >
                  <div className="swipe-card">
                    <span className="stamp-like">❤ ADOTAR</span>
                    <span className="stamp-nope">✕ PULAR</span>
                    {getMainPhoto(animal)
                      ? <img className="swipe-card-photo" src={getMainPhoto(animal)} alt={animal.name} />
                      : <div className="swipe-card-photo-placeholder">{SPECIES_EMOJI[animal.species] || '🐾'}</div>
                    }
                    <div className="swipe-card-info">
                      <h3>{animal.name} {SPECIES_EMOJI[animal.species]}</h3>
                      <div className="animal-meta">
                        {animal.breed && <span className="animal-tag">{animal.breed}</span>}
                        {animal.sex && <span className="animal-tag">{animal.sex === 'M' ? '♂ Macho' : '♀ Fêmea'}</span>}
                        {animal.size && <span className="animal-tag">{animal.size}</span>}
                        {animal.age && <span className="animal-tag">{animal.age}{animal.age_approx ? '~ anos' : ' anos'}</span>}
                      </div>
                      {animal.description && (
                        <p className="swipe-card-desc">{animal.description}</p>
                      )}
                    </div>
                  </div>
                </TinderCard>
              </div>
            ))}
          </div>
        )}
      </div>

      {animals.length > 0 && !loading && (
        <div className="swipe-actions">
          <button className="action-btn nope" title="Pular" onClick={() => swipe('right')}>✕</button>
          <button className="action-btn like" title="Quero Adotar!" onClick={() => swipe('left')}>❤</button>
        </div>
      )}

      {/* Match modal */}
      {match && (
        <div className="match-overlay" onClick={() => setMatch(null)}>
          <div style={{ fontSize: '3rem' }}>🎉</div>
          <h2>É um Match!</h2>
          <div className="match-info" onClick={e => e.stopPropagation()}>
            {getMainPhoto(match) && (
              <img src={getMainPhoto(match)} alt={match.name} style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.75rem' }} />
            )}
            <strong style={{ fontSize: '1.2rem' }}>{match.name}</strong>
            <p>Você demonstrou interesse em adotar este animal! Entre em contato com o doador:</p>
            <div className="contact-info">
              {match.profiles?.name && <div className="contact-row">👤 {match.profiles.name}</div>}
              {match.profiles?.phone && <div className="contact-row">📱 <a href={`https://wa.me/55${match.profiles.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">{match.profiles.phone}</a></div>}
              {match.profiles?.email && <div className="contact-row">📧 <a href={`mailto:${match.profiles.email}`}>{match.profiles.email}</a></div>}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setMatch(null)}>Continuar procurando</button>
        </div>
      )}

      {/* Filter modal */}
      {showFilters && (
        <div className="filter-modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="filter-modal" onClick={e => e.stopPropagation()}>
            <h3>Filtros <button className="btn btn-ghost" style={{ fontSize: '1.2rem', padding: 0 }} onClick={() => setShowFilters(false)}>×</button></h3>

            <div className="form-group">
              <label>Espécie</label>
              <div className="radio-group">
                {[['', 'Todos'], ['cachorro', '🐕 Cachorro'], ['gato', '🐈 Gato']].map(([v, l]) => (
                  <div key={v} className={`radio-pill ${filters.species === v ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, species: v, breed: '' }))}>{l}</div>
                ))}
              </div>
            </div>
            
            {filters.species && (
              <div className="form-group">
                <label>Raça</label>
                <div className="scrollable-radio-wrapper" style={{ maxHeight: '120px' }}>
                  <div className="radio-group">
                    <div className={`radio-pill ${filters.breed === '' ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, breed: '' }))}>Todas</div>
                    {(filters.species === 'cachorro' ? BREEDS_DOG : BREEDS_CAT).map(b => (
                      <div key={b} className={`radio-pill ${filters.breed === b ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, breed: b }))}>{b}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Sexo</label>
              <div className="radio-group">
                {[['', 'Todos'], ['M', '♂ Macho'], ['F', '♀ Fêmea']].map(([v, l]) => (
                  <div key={v} className={`radio-pill ${filters.sex === v ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, sex: v }))}>{l}</div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Porte</label>
              <div className="radio-group">
                {[['', 'Todos'], ['micro', 'Micro'], ['pequeno', 'Pequeno'], ['médio', 'Médio'], ['grande', 'Grande']].map(([v, l]) => (
                  <div key={v} className={`radio-pill ${filters.size === v ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, size: v }))}>{l}</div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Idade (anos)</label>
              <div className="radio-group">
                {[['', 'Todos'], ['1','1'], ['2','2'], ['3','3'], ['4','4'], ['5','5'], ['6','6'], ['7','7'], ['8','8+']].map(([v, l]) => (
                  <div key={v} className={`radio-pill ${filters.age === v ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, age: v }))}>{l}</div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Se dá bem com crianças?</label>
              <div className="radio-group">
                {[['', 'Todos'], ['sim', '✅ Sim'], ['nao', '❌ Não'], ['tanto_faz', '🤷 Tanto faz']].map(([v, l]) => (
                  <div key={v} className={`radio-pill ${filters.ok_children === v ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, ok_children: v }))}>{l}</div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Se dá bem com outros animais?</label>
              <div className="radio-group">
                {[['', 'Todos'], ['sim', '✅ Sim'], ['nao', '❌ Não'], ['tanto_faz', '🤷 Tanto faz']].map(([v, l]) => (
                  <div key={v} className={`radio-pill ${filters.ok_animals === v ? 'selected' : ''}`} onClick={() => setFilters(f => ({ ...f, ok_animals: v }))}>{l}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setFilters(DEFAULT_FILTERS); setShowFilters(false) }}>Limpar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowFilters(false)}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
