import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

// localStorage key per user per field
const lsKey = (uid, field) => `sf_${uid}_${field}`

export function useFirestoreField(uid, field, defaultValue) {
  // Initialise from localStorage so data survives refresh even before Firestore responds
  const [value, setValueLocal] = useState(() => {
    if (!uid) return defaultValue
    try {
      const cached = localStorage.getItem(lsKey(uid, field))
      return cached !== null ? JSON.parse(cached) : defaultValue
    } catch { return defaultValue }
  })

  const uidRef   = useRef(uid)
  const fieldRef = useRef(field)
  const timer    = useRef(null)

  useEffect(() => { uidRef.current = uid }, [uid])
  useEffect(() => { fieldRef.current = field }, [field])

  // Subscribe to Firestore — overwrites local cache when cloud data arrives
  useEffect(() => {
    if (!uid) return
    const ref = doc(db, 'users', uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          if (data[field] !== undefined) {
            setValueLocal(data[field])
            // Keep localStorage in sync with cloud
            try { localStorage.setItem(lsKey(uid, field), JSON.stringify(data[field])) } catch {}
          }
        }
      },
      (err) => console.warn(`Firestore [${field}] read error:`, err.code)
    )
    return unsub
  }, [uid, field])

  const setValue = useCallback((updater) => {
    setValueLocal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater

      // 1. Save to localStorage immediately — survives refresh even if Firestore is down
      try { localStorage.setItem(lsKey(uidRef.current, fieldRef.current), JSON.stringify(next)) } catch {}

      // 2. Debounced write to Firestore
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const currentUid = uidRef.current
        if (!currentUid) return
        try {
          await setDoc(
            doc(db, 'users', currentUid),
            { [fieldRef.current]: next },
            { merge: true }
          )
        } catch (err) {
          console.warn(`Firestore [${fieldRef.current}] write error:`, err.code)
          // Data is still safe in localStorage
        }
      }, 600)

      return next
    })
  }, [])

  return [value, setValue]
}
