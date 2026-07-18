// ─── Firestore data layer ─────────────────────────────────────────────────────
'use client'

import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  addDoc, query, where, onSnapshot, serverTimestamp,
  Timestamp, orderBy, limit, getDocs,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MonthBudget, VariableExpense, FixedExpense, SavingGoal } from './store'

// ── User profile ──────────────────────────────────────────────────────────────
export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  plan: 'free' | 'pro'
  createdAt: Timestamp
  currency: string
  onboardingComplete?: boolean
}

export async function upsertUserProfile(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, { uid, plan: 'free', currency: 'MAD', createdAt: serverTimestamp(), ...data })
  } else {
    await updateDoc(ref, data)
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

// ── Month budgets ─────────────────────────────────────────────────────────────
export function monthDocRef(uid: string, monthId: string) {
  return doc(db, 'users', uid, 'months', monthId)
}

export async function getMonth(uid: string, monthId: string): Promise<MonthBudget | null> {
  const snap = await getDoc(monthDocRef(uid, monthId))
  return snap.exists() ? (snap.data() as MonthBudget) : null
}

export async function saveMonth(uid: string, month: MonthBudget) {
  await setDoc(monthDocRef(uid, month.id), { ...month, updatedAt: serverTimestamp() })
}

// Subscribes to a month document. `onError` fires on permission-denied /
// offline / rules-misconfiguration errors so the UI can show a real message
// instead of spinning forever or silently losing writes.
export function subscribeMonth(
  uid: string,
  monthId: string,
  cb: (m: MonthBudget | null) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    monthDocRef(uid, monthId),
    snap => cb(snap.exists() ? (snap.data() as MonthBudget) : null),
    err => {
      console.error('subscribeMonth error', err)
      onError?.(err as unknown as Error)
    }
  )
}

export async function listMonths(uid: string): Promise<MonthBudget[]> {
  const col = collection(db, 'users', uid, 'months')
  const q = query(col, orderBy('month', 'desc'), limit(24))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as MonthBudget)
}
