import { db } from '../firebase'
import {
  collection, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, doc, getDoc, setDoc,
} from 'firebase/firestore'

// ── Analysis history ──────────────────────────────────────────────────────────

export async function saveAnalysis(uid, data) {
  return addDoc(collection(db, 'users', uid, 'analyses'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getAnalyses(uid) {
  const q = query(
    collection(db, 'users', uid, 'analyses'),
    orderBy('createdAt', 'desc'),
    limit(30),
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Farm profile ──────────────────────────────────────────────────────────────

export async function getFarmProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'profile', 'farm'))
  return snap.exists() ? snap.data() : null
}

export async function saveFarmProfile(uid, data) {
  return setDoc(doc(db, 'users', uid, 'profile', 'farm'), data, { merge: true })
}
