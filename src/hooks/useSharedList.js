import { useState, useEffect, useRef } from 'react'
import {
  collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

// Firebase未設定時はlocalStorageフォールバック
function loadLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? [] }
  catch { return [] }
}
function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function useSharedList(householdId, listName) {
  const localKey = `noborito-${listName}`
  const [items, setItems] = useState([])
  const [syncing, setSyncing] = useState(false)
  const unsubRef = useRef(null)

  const isOnline = isFirebaseConfigured && !!householdId

  useEffect(() => {
    if (!isOnline) {
      setItems(loadLocal(localKey))
      return
    }

    setSyncing(true)
    const colRef = collection(db, 'households', householdId, listName)
    const q = query(colRef, orderBy('createdAt', 'desc'))

    unsubRef.current = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setItems(data)
      setSyncing(false)
    }, (err) => {
      console.error('Firestore error:', err)
      setSyncing(false)
      // フォールバック: localStorageから読み込み
      setItems(loadLocal(localKey))
    })

    return () => unsubRef.current?.()
  }, [householdId, listName, isOnline])

  // localStorageにも常にキャッシュ（オフライン対応）
  useEffect(() => {
    if (items.length >= 0) saveLocal(localKey, items)
  }, [items])

  async function addItem(item) {
    const newItem = { ...item, createdAt: isOnline ? serverTimestamp() : new Date().toISOString() }
    if (isOnline) {
      const docRef = doc(collection(db, 'households', householdId, listName))
      await setDoc(docRef, { ...newItem, id: docRef.id })
    } else {
      setItems(prev => [{ ...newItem, id: Date.now().toString() }, ...prev])
    }
  }

  async function updateItem(id, changes) {
    if (isOnline) {
      await updateDoc(doc(db, 'households', householdId, listName, id), {
        ...changes,
        updatedAt: serverTimestamp(),
      })
    } else {
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...changes } : i))
    }
  }

  async function removeItem(id) {
    if (isOnline) {
      await deleteDoc(doc(db, 'households', householdId, listName, id))
    } else {
      setItems(prev => prev.filter(i => i.id !== id))
    }
  }

  async function clearDone() {
    const done = items.filter(i => i.done)
    if (isOnline) {
      await Promise.all(done.map(i => deleteDoc(doc(db, 'households', householdId, listName, i.id))))
    } else {
      setItems(prev => prev.filter(i => !i.done))
    }
  }

  return { items, syncing, isOnline, addItem, updateItem, removeItem, clearDone }
}
