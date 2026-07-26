// ─── Firestore data layer ─────────────────────────────────────────────────────
'use client'

import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  addDoc, query, where, onSnapshot, serverTimestamp,
  Timestamp, orderBy, limit, getDocs,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MonthBudget, VariableExpense, FixedExpense, SavingGoal, SavingsData, DebtsData } from './store'
import { normalizeMonth, emptySavings, emptyDebts } from './store'

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
  return snap.exists() ? normalizeMonth(snap.data() as MonthBudget) : null
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
    snap => cb(snap.exists() ? normalizeMonth(snap.data() as MonthBudget) : null),
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
  return snap.docs.map(d => normalizeMonth(d.data() as MonthBudget))
}

// ── Saving goals ──────────────────────────────────────────────────────────────
// Saving goals live at the user level, not inside a month document - the
// money you set aside in April is still saved in May. Months only ever
// affect a goal's balance by moving money into/out of it; they never own
// the goal itself, so nothing resets or gets duplicated when a new month
// rolls over.
export function savingsDocRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'savings')
}

export async function getSavings(uid: string): Promise<SavingsData | null> {
  const snap = await getDoc(savingsDocRef(uid))
  return snap.exists() ? (snap.data() as SavingsData) : null
}

export async function saveSavings(uid: string, data: SavingsData) {
  await setDoc(savingsDocRef(uid), { ...data, updatedAt: serverTimestamp() })
}

export function subscribeSavings(
  uid: string,
  cb: (s: SavingsData) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    savingsDocRef(uid),
    snap => cb(snap.exists() ? (snap.data() as SavingsData) : emptySavings()),
    err => {
      console.error('subscribeSavings error', err)
      onError?.(err as unknown as Error)
    }
  )
}

// ── Debts & Credits ───────────────────────────────────────────────────────
// Same shape as saving goals: one doc per user, independent of which month
// is being viewed - an IOU doesn't reset when the calendar rolls over.
export function debtsDocRef(uid: string) {
  return doc(db, 'users', uid, 'data', 'debts')
}

export async function getDebts(uid: string): Promise<DebtsData | null> {
  const snap = await getDoc(debtsDocRef(uid))
  return snap.exists() ? (snap.data() as DebtsData) : null
}

export async function saveDebts(uid: string, data: DebtsData) {
  await setDoc(debtsDocRef(uid), { ...data, updatedAt: serverTimestamp() })
}

export function subscribeDebts(
  uid: string,
  cb: (d: DebtsData) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    debtsDocRef(uid),
    snap => cb(snap.exists() ? (snap.data() as DebtsData) : emptyDebts()),
    err => {
      console.error('subscribeDebts error', err)
      onError?.(err as unknown as Error)
    }
  )
}
