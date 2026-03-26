import { useState, useEffect, useRef } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? [] }
  catch { return [] }
}
function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

const LOCAL_KEY = 'noborito-memos'

export function useSharedMemos(householdId) {
  const [memos, setMemos] = useState([])
  const [syncing, setSyncing] = useState(false)
  const unsubRef = useRef(null)

  const isOnline = isFirebaseConfigured && !!householdId

  useEffect(() => {
    if (!isOnline) {
      setMemos(loadLocal(LOCAL_KEY))
      return
    }

    setSyncing(true)
    const colRef = collection(db, 'households', householdId, 'memos')
    const q = query(colRef, orderBy('updatedAt', 'desc'))

    unsubRef.current = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMemos(data)
      setSyncing(false)
    }, (err) => {
      console.error('Firestore error:', err)
      setSyncing(false)
      setMemos(loadLocal(LOCAL_KEY))
    })

    return () => unsubRef.current?.()
  }, [householdId, isOnline])

  useEffect(() => {
    if (memos.length >= 0) saveLocal(LOCAL_KEY, memos)
  }, [memos])

  async function saveMemo(memo) {
    const now = isOnline ? serverTimestamp() : new Date().toISOString()
    if (memo.id) {
      // 更新
      if (isOnline) {
        await updateDoc(doc(db, 'households', householdId, 'memos', memo.id), {
          title: memo.title,
          body: memo.body,
          color: memo.color,
          updatedAt: now,
        })
      } else {
        setMemos(prev => prev.map(m => m.id === memo.id ? { ...m, ...memo, updatedAt: now } : m))
      }
    } else {
      // 新規
      const newMemo = { ...memo, createdAt: now, updatedAt: now }
      if (isOnline) {
        const docRef = doc(collection(db, 'households', householdId, 'memos'))
        await setDoc(docRef, { ...newMemo, id: docRef.id })
      } else {
        setMemos(prev => [{ ...newMemo, id: Date.now().toString() }, ...prev])
      }
    }
  }

  async function deleteMemo(id) {
    if (isOnline) {
      await deleteDoc(doc(db, 'households', householdId, 'memos', id))
    } else {
      setMemos(prev => prev.filter(m => m.id !== id))
    }
  }

  return { memos, syncing, isOnline, saveMemo, deleteMemo }
}
