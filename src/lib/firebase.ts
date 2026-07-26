// ─── Firebase Configuration ───────────────────────────────────────────────────
// Replace these with your actual Firebase project credentials from:
// https://console.firebase.google.com → Project Settings → Your Apps → Web App

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// True only when every required env var is present. The app checks this
// before touching auth/db so a missing .env.local fails with a clear
// on-screen message instead of a cryptic Firebase runtime error.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId &&
  firebaseConfig.storageBucket && firebaseConfig.messagingSenderId && firebaseConfig.appId
)

let app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _googleProvider: GoogleAuthProvider | null = null

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as Record<string, string>)
  _auth = getAuth(app)
  _db = getFirestore(app)
  _googleProvider = new GoogleAuthProvider()
}

// These are only safe to use after checking `isFirebaseConfigured`.
// Cast so the rest of the codebase (which assumes Firebase is always
// configured in production) doesn't need null-checks everywhere.
export const auth = _auth as Auth
export const db = _db as Firestore
export const googleProvider = _googleProvider as GoogleAuthProvider
