import { db } from '../firebase'
import {
  collection, addDoc, getDocs, query, orderBy, limit,
  serverTimestamp, doc, getDoc, setDoc, deleteDoc, writeBatch,
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

// ── History management ────────────────────────────────────────────────────────

export async function deleteAnalysis(uid, docId) {
  return deleteDoc(doc(db, 'users', uid, 'analyses', docId))
}

export async function clearAllAnalyses(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'analyses'))
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  return batch.commit()
}
