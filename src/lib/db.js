import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ══════════════════════════════════════════
//   AUTH
// ══════════════════════════════════════════
export const DB = {
  // Sign up with email/password + name + phone + role
  async signUp(email, password, { name, phone, role }) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, phone, role } }
    })
    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.user
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  // ══════════════════════════════════════════
  //   PROFILES
  // ══════════════════════════════════════════
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async upsertProfile(userId, profile) {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profile })
    if (error) throw error
  },

  // ══════════════════════════════════════════
  //   ANIMALS
  // ══════════════════════════════════════════
  async getMyAnimals(userId) {
    const { data, error } = await supabase
      .from('animals')
      .select('*, animal_photos(url, order)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getAnimalsForAdoption(filters = {}) {
    let query = supabase
      .from('animals')
      .select('*, animal_photos(url, order), profiles(name, phone, email)')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (filters.species) query = query.eq('species', filters.species)
    if (filters.breed) query = query.eq('breed', filters.breed)
    if (filters.sex) query = query.eq('sex', filters.sex)
    if (filters.size) query = query.eq('size', filters.size)
    if (filters.age) query = query.eq('age', parseInt(filters.age))
    if (filters.ok_children) query = query.eq('ok_children', filters.ok_children)
    if (filters.ok_animals) query = query.eq('ok_animals', filters.ok_animals)

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async createAnimal(animal) {
    const { data, error } = await supabase
      .from('animals')
      .insert([animal])
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateAnimal(id, animal) {
    const { error } = await supabase
      .from('animals')
      .update(animal)
      .eq('id', id)
    if (error) throw error
  },

  async deleteAnimal(id) {
    const { error } = await supabase
      .from('animals')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // ══════════════════════════════════════════
  //   ANIMAL PHOTOS
  // ══════════════════════════════════════════
  async uploadAnimalPhoto(animalId, file, order) {
    const ext = file.name.split('.').pop()
    const path = `${animalId}/${order}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('animal-photos')
      .upload(path, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('animal-photos')
      .getPublicUrl(path)

    const { error: dbError } = await supabase
      .from('animal_photos')
      .upsert({ animal_id: animalId, url: urlData.publicUrl, order })
    if (dbError) throw dbError

    return urlData.publicUrl
  },

  async deleteAnimalPhoto(animalId, order) {
    await supabase.from('animal_photos').delete()
      .eq('animal_id', animalId).eq('order', order)
  },

  // ══════════════════════════════════════════
  //   SWIPES
  // ══════════════════════════════════════════
  async recordSwipe(userId, animalId, action) {
    // action: 'like' | 'skip'
    const { error } = await supabase
      .from('swipes')
      .upsert({ user_id: userId, animal_id: animalId, action })
    if (error) throw error
  },

  async getSwipedAnimalIds(userId) {
    const { data, error } = await supabase
      .from('swipes')
      .select('animal_id')
      .eq('user_id', userId)
    if (error) throw error
    return (data || []).map(s => s.animal_id)
  },
}
