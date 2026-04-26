import { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider, facebookProvider } from '../firebase'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [isAdmin, setIsAdmin]     = useState(false)
  const backendTokenRef           = useRef(null)  // cached backend JWT

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 6000)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout)
      setUser(firebaseUser)
      backendTokenRef.current = null  // clear cache on auth change
      setIsAdmin(false)

      if (firebaseUser) {
        try {
          const token = await _exchangeForBackendJWT(firebaseUser)
          if (token) {
            const me = await fetch(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.ok ? r.json() : null)
            if (me?.role === 'ADMIN') setIsAdmin(true)
          }
        } catch {
          // non-fatal — admin features simply won't be accessible
        }
      }

      setLoading(false)
    })
    return () => { unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function _exchangeForBackendJWT(firebaseUser) {
    const idToken = await firebaseUser.getIdToken()
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    })
    if (!res.ok) return null
    const { access_token } = await res.json()
    backendTokenRef.current = access_token
    return access_token
  }

  /** Returns a fresh backend JWT, re-exchanging if the cache is empty. */
  async function getBackendToken() {
    if (backendTokenRef.current) return backendTokenRef.current
    if (!user) return null
    return _exchangeForBackendJWT(user)
  }

  const loginWithGoogle   = () => signInWithPopup(auth, googleProvider)
  const loginWithFacebook = () => signInWithPopup(auth, facebookProvider)
  const loginWithEmail    = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    return result
  }

  const logout = () => {
    backendTokenRef.current = null
    setIsAdmin(false)
    return signOut(auth)
  }

  const isAuthenticated = !!user

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #d4e6a5', borderTopColor: '#558b2f', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isAdmin, getBackendToken,
      loginWithGoogle, loginWithFacebook, loginWithEmail, registerWithEmail, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
