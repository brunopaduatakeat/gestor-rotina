import { create } from 'zustand'

export type UserRole = 'manager' | 'member'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  loading: boolean

  /** Verifica o token salvo no localStorage e carrega o usuário */
  init: () => Promise<void>

  login:    (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout:   () => void

  /** Gestor cria conta para um membro da equipe */
  createMember: (name: string, email: string, password: string, personId?: string) => Promise<AuthUser>
}

const TOKEN_KEY = 'gestor_token'

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
  return data
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user:    null,
  token:   null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { set({ loading: false }); return }
    try {
      const data = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      set({ user: data.user, token, loading: false })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem(TOKEN_KEY, data.token)
    set({ user: data.user, token: data.token })
  },

  register: async (name, email, password) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    localStorage.setItem(TOKEN_KEY, data.token)
    set({ user: data.user, token: data.token })
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null })
  },

  createMember: async (name, email, password, personId) => {
    const token = get().token
    if (!token) throw new Error('Não autenticado.')
    const data = await apiFetch('/api/auth/create-member', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ name, email, password, personId }),
    })
    return data.user as AuthUser
  },
}))
