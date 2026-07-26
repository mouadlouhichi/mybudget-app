'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut as firebaseSignOut, User, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail,
  sendEmailVerification, deleteUser, reauthenticateWithPopup,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from './firebase'
import { upsertUserProfile, getUserProfile, deleteAllUserData, UserProfile } from './db'

interface AuthCtx {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configError: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, pass: string) => Promise<void>
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  signOut: () => Promise<void>
  completeOnboarding: () => Promise<void>
  setCurrency: (code: string) => Promise<void>
  deleteAccount: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

// Popups are blocked outright in most in-app browsers (Instagram, LinkedIn,
// Facebook webviews) and some Android WebViews, where the sign-in silently
// fails. Detect those and go straight to the redirect flow instead (H8).
function prefersRedirect(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|Line|Twitter|LinkedIn|WebView|wv\)/i.test(ua)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No Firebase project wired up yet - don't touch the SDK at all.
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }

    // Completes a signInWithRedirect round trip, if one is in flight.
    getRedirectResult(auth).catch(e => console.error('redirect sign-in failed', e))

    return onAuthStateChanged(auth, async u => {
      setUser(u)
      if (u) {
        try {
          await upsertUserProfile(u.uid, {
            email: u.email!,
            displayName: u.displayName || 'User',
            photoURL: u.photoURL || undefined,
          })
          setProfile(await getUserProfile(u.uid))
        } catch (e) {
          // Profile read/write failing (e.g. rules not deployed yet)
          // shouldn't lock the user out of the app entirely.
          console.error('Failed to load/create user profile', e)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const signInGoogle = useCallback(async () => {
    if (prefersRedirect()) {
      await signInWithRedirect(auth, googleProvider)
      return
    }
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? ''
      // Popup was blocked or dismissed by the environment - fall back rather
      // than leaving the user staring at a dead button.
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider)
        return
      }
      throw e
    }
  }, [])

  const signInEmail = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass)
  }, [])

  const signUpEmail = useCallback(async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass)
    await updateProfile(cred.user, { displayName: name })
    // Fire-and-forget: a failure here must not block account creation (H9).
    sendEmailVerification(cred.user).catch(e => console.error('verification email failed', e))
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  const resendVerification = useCallback(async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const completeOnboarding = useCallback(async () => {
    if (!auth.currentUser) return
    await upsertUserProfile(auth.currentUser.uid, { onboardingComplete: true })
    setProfile(await getUserProfile(auth.currentUser.uid))
  }, [])

  const setCurrency = useCallback(async (code: string) => {
    if (!auth.currentUser) return
    await upsertUserProfile(auth.currentUser.uid, { currency: code })
    setProfile(await getUserProfile(auth.currentUser.uid))
  }, [])

  // Erases Firestore data first, then the auth record. If the credential is
  // too old Firebase demands a fresh sign-in; for Google accounts we can
  // reauthenticate inline, otherwise the caller surfaces the error.
  const deleteAccount = useCallback(async () => {
    const u = auth.currentUser
    if (!u) return
    await deleteAllUserData(u.uid)
    try {
      await deleteUser(u)
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'auth/requires-recent-login') {
        const isGoogle = u.providerData.some(p => p.providerId === 'google.com')
        if (isGoogle) {
          await reauthenticateWithPopup(u, googleProvider)
          await deleteUser(u)
          return
        }
      }
      throw e
    }
  }, [])

  return (
    <Ctx.Provider
      value={{
        user, profile, loading, configError: !isFirebaseConfigured,
        signInGoogle, signInEmail, signUpEmail, resetPassword, resendVerification,
        signOut, completeOnboarding, setCurrency, deleteAccount,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
