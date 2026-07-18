'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut,
  User, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './firebase'
import { upsertUserProfile, getUserProfile, UserProfile } from './db'

interface AuthCtx {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configError: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, pass: string) => Promise<void>
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No Firebase project wired up yet — don't touch the SDK at all.
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        try {
          await upsertUserProfile(u.uid, { email: u.email!, displayName: u.displayName || 'User', photoURL: u.photoURL || undefined })
          const p = await getUserProfile(u.uid)
          setProfile(p)
        } catch (e) {
          // Profile read/write failing (e.g. Firestore rules not deployed
          // yet) shouldn't block the user out of the app entirely.
          console.error('Failed to load/create user profile', e)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  async function signInGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signInEmail(email: string, pass: string) {
    await signInWithEmailAndPassword(auth, email, pass)
  }

  async function signUpEmail(email: string, pass: string, name: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass)
    await updateProfile(cred.user, { displayName: name })
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return (
    <Ctx.Provider value={{ user, profile, loading, configError: !isFirebaseConfigured, signInGoogle, signInEmail, signUpEmail, resetPassword, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
