import { useState, useEffect } from 'react'
import {
  onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail,
  signInWithPopup, GoogleAuthProvider
} from 'firebase/auth'
import { auth, provider } from '../firebase.js'

export function useAuth() {
  const [user, setUser]       = useState(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginGoogle = () => signInWithPopup(auth, provider)

  const loginEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const registerEmail = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    return cred
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const logout = () => signOut(auth)

  return { user, loading, loginGoogle, loginEmail, registerEmail, resetPassword, logout }
}
