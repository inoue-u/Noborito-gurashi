import { useState, useEffect } from 'react'

const STORAGE_KEY = 'noborito-household-id'

// 6文字のランダムコードを生成
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function useHousehold() {
  const [householdId, setHouseholdId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null
  })

  function createHousehold() {
    const id = generateCode()
    localStorage.setItem(STORAGE_KEY, id)
    setHouseholdId(id)
    return id
  }

  function joinHousehold(code) {
    const id = code.trim().toUpperCase()
    if (id.length < 4) return false
    localStorage.setItem(STORAGE_KEY, id)
    setHouseholdId(id)
    return true
  }

  function leaveHousehold() {
    localStorage.removeItem(STORAGE_KEY)
    setHouseholdId(null)
  }

  return { householdId, createHousehold, joinHousehold, leaveHousehold }
}
