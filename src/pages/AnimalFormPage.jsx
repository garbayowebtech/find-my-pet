import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DB } from '../lib/db'

const BREEDS_DOG = ['SRD (Vira-lata)', 'Labrador', 'Golden Retriever', 'Bulldog', 'Poodle', 'Beagle', 'Shih Tzu', 'Pinscher', 'Lhasa Apso', 'Yorkshire', 'Dachshund', 'Border Collie', 'Pastor Alemão', 'Rottweiler', 'Husky Siberiano', 'Outra']
const BREEDS_CAT = ['SRD (Vira-lata)', 'Persa', 'Siamês', 'Maine Coon', 'Angorá', 'Bengal', 'Ragdoll', 'British Shorthair', 'Scottish Fold', 'Sphynx', 'Outra']

const INITIAL_FORM = {
  name: '', species: 'cachorro', breed: '', sex: '', size: '', age: '', age_approx: false,
  ok_animals: '', ok_children: '', description: ''
}

const RadioPills = ({ options, value, onChange }) => (
  <div className="radio-group">
    {options.map(([v, l]) => (
      <div key={v} className={`radio-pill ${value === v ? 'selected' : ''}`} onClick={() => onChange(v)}>{l}</div>
    ))}
  </div>
)

export default function AnimalFormPage({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const userId = session.user.id
  const isEdit = Boolean(id)
  const inputFileRef = useRef(null)

  const [form, setForm] = useState(INITIAL_FORM)
  const [photos, setPhotos] = useState([]) // { url, file?, order }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) loadAnimal()
  }, [id])

  const loadAnimal = async () => {
    const myAnimals = await DB.getMyAnimals(userId)
    const animal = myAnimals.find(a => a.id === id)
    if (!animal) { navigate('/donor'); return }
    setForm({
      name: animal.name || '',
      species: animal.species || 'cachorro',
      breed: animal.breed || '',
      sex: animal.sex || '',
      size: animal.size || '',
      age: animal.age != null ? String(animal.age) : '',
      age_approx: animal.age_approx || false,
      ok_animals: animal.ok_animals ?? '',
      ok_children: animal.ok_children ?? '',
      description: animal.description || ''
    })
    const sorted = [...(animal.animal_photos || [])].sort((a, b) => a.order - b.order)
    setPhotos(sorted.map(p => ({ url: p.url, order: p.order })))
  }

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }))

  const breedList = form.species === 'cachorro' ? BREEDS_DOG : BREEDS_CAT

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 5 - photos.length
    files.slice(0, remaining).forEach((file, i) => {
      const order = photos.length + i
      const url = URL.createObjectURL(file)
      setPhotos(prev => [...prev, { url, file, order }])
    })
    e.target.value = ''
  }

  const removePhoto = (order) => {
    setPhotos(prev => prev.filter(p => p.order !== order).map((p, i) => ({ ...p, order: i })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (photos.length === 0) { setError('Adicione pelo menos 1 foto.'); return }
    if (!form.sex) { setError('Selecione o sexo.'); return }
    if (!form.size) { setError('Selecione o porte.'); return }
    if (!form.age) { setError('Informe a idade.'); return }

    setSaving(true)
    try {
      const payload = {
        owner_id: userId,
        name: form.name,
        species: form.species,
        breed: form.breed,
        sex: form.sex,
        size: form.size,
        age: parseInt(form.age),
        age_approx: form.age_approx,
        ok_animals: form.ok_animals === '' ? null : form.ok_animals,
        ok_children: form.ok_children === '' ? null : form.ok_children,
        description: form.description,
        active: true
      }

      let animalId = id
      if (isEdit) {
        await DB.updateAnimal(id, payload)
      } else {
        const created = await DB.createAnimal(payload)
        animalId = created.id
      }

      // Upload new photos
      for (const photo of photos) {
        if (photo.file) {
          await DB.uploadAnimalPhoto(animalId, photo.file, photo.order)
        }
      }

      navigate('/donor')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const charLeft = 300 - form.description.length

  return (
    <div className="form-screen">
      <div className="form-header">
        <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem' }} onClick={() => navigate('/donor')}>← Voltar</button>
        <h2>{isEdit ? 'Editar Animal' : 'Cadastrar Animal'}</h2>
      </div>

      <div className="form-content">
        <form onSubmit={handleSubmit}>
          {/* Photos */}
          <div className="form-group">
            <label>Fotos ({photos.length}/5) — mínimo 1 *</label>
            <div className="photo-upload-grid">
              {photos.map(p => (
                <div className="photo-slot" key={p.order}>
                  <img src={p.url} alt="" />
                  <button type="button" className="remove-photo" onClick={() => removePhoto(p.order)}>×</button>
                </div>
              ))}
              {photos.length < 5 && (
                <div className="photo-slot" onClick={() => inputFileRef.current.click()}>
                  <span style={{ fontSize: '1.5rem', color: 'var(--c-text-muted)' }}>+</span>
                </div>
              )}
            </div>
            <input ref={inputFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoSelect} />
          </div>

          {/* Name */}
          <div className="form-group">
            <label>Nome do animal *</label>
            <input className="form-control" required value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Ex: Rex, Mia..." />
          </div>

          {/* Species */}
          <div className="form-group">
            <label>Espécie *</label>
            <RadioPills options={[['cachorro', '🐕 Cachorro'], ['gato', '🐈 Gato']]} value={form.species} onChange={v => { set('species')(v); set('breed')('') }} />
          </div>

          {/* Breed */}
          <div className="form-group">
            <label>Raça</label>
            <select className="form-control" value={form.breed} onChange={e => set('breed')(e.target.value)}>
              <option value="">Selecione...</option>
              {breedList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Sex */}
          <div className="form-group">
            <label>Sexo *</label>
            <RadioPills options={[['M', '♂ Macho'], ['F', '♀ Fêmea']]} value={form.sex} onChange={set('sex')} />
          </div>

          {/* Size */}
          <div className="form-group">
            <label>Porte *</label>
            <RadioPills options={[['micro', 'Micro'], ['pequeno', 'Pequeno'], ['médio', 'Médio'], ['grande', 'Grande']]} value={form.size} onChange={set('size')} />
          </div>

          {/* Age */}
          <div className="form-group">
            <label>Idade (anos) *</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <RadioPills options={[['1','1'], ['2','2'], ['3','3'], ['4','4'], ['5','5'], ['6','6'], ['7','7'], ['8','8+']]} value={form.age} onChange={set('age')} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.age_approx} onChange={e => set('age_approx')(e.target.checked)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--c-text-muted)' }}>Idade aproximada</span>
            </label>
          </div>

          {/* Ok with animals */}
          <div className="form-group">
            <label>Se dá bem com outros animais?</label>
            <RadioPills options={[['sim', '✅ Sim'], ['nao', '❌ Não'], ['tanto_faz', '🤷 Tanto faz']]} value={form.ok_animals} onChange={set('ok_animals')} />
          </div>

          {/* Ok with kids */}
          <div className="form-group">
            <label>Se dá bem com crianças?</label>
            <RadioPills options={[['sim', '✅ Sim'], ['nao', '❌ Não'], ['tanto_faz', '🤷 Tanto faz']]} value={form.ok_children} onChange={set('ok_children')} />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Descrição (opcional, até 300 caracteres)</label>
            <textarea
              className="form-control"
              rows={4}
              maxLength={300}
              value={form.description}
              onChange={e => set('description')(e.target.value)}
              placeholder="Conte um pouco sobre o animal: personalidade, hábitos, cuidados especiais..."
              style={{ resize: 'vertical' }}
            />
            <div className="char-counter" style={{ color: charLeft < 50 ? 'var(--c-warning)' : undefined }}>
              {charLeft} caracteres restantes
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '0.5rem', marginBottom: '2rem' }} disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? '💾 Salvar Alterações' : '🐾 Cadastrar Animal'}
          </button>
        </form>
      </div>
    </div>
  )
}
