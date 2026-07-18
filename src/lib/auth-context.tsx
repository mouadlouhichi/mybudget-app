'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut,
  User, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { upsertUserProfile, getUserProfile, UserProfile } from './db'

interface AuthCtx {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, pass: string) => Promise<void>
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        await upsertUserProfile(u.uid, { email: u.email!, displayName: u.displayName || 'User', photoURL: u.photoURL || undefined })
        const p = await getUserProfile(u.uid)
        setProfile(p)
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

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return <Ctx.Provider value={{ user, profile, loading, signInGoogle, signInEmail, signUpEmail, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
