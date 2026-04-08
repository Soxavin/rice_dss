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

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading = true until Firebase tells us the initial auth state
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // W4: if Firebase doesn't respond in 6s (bad network, missing config), unblock the app
    const timeout = setTimeout(() => setLoading(false), 6000)
    // Firebase calls this once immediately with the persisted user (or null),
    // then again any time the user signs in or out.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout)
      setUser(firebaseUser)
      setLoading(false)
    })
    return () => { unsubscribe(); clearTimeout(timeout) }
  }, [])

  const loginWithGoogle   = () => signInWithPopup(auth, googleProvider)
  const loginWithFacebook = () => signInWithPopup(auth, facebookProvider)
  const loginWithEmail    = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    // Store the display name on the Firebase user profile
    await updateProfile(result.user, { displayName: name })
    return result
  }

  const logout = () => signOut(auth)

  const isAuthenticated = !!user

  // Don't render children until we know auth state — prevents brief "logged out" flash
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #d4e6a5', borderTopColor: '#558b2f', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginWithGoogle, loginWithFacebook, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
