import { useState } from 'react'
import styles from './HouseholdBadge.module.css'
import { isFirebaseConfigured } from '../firebase'

export default function HouseholdBadge({ householdId, onLeave }) {
  const [copied, setCopied] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(householdId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className={styles.offlineBadge}>
        <span>📴</span>
        <span>オフラインモード（Firebase未設定）</span>
      </div>
    )
  }

  return (
    <div className={styles.badge}>
      <div className={styles.badgeLeft}>
        <span className={styles.syncIcon}>🔄</span>
        <span className={styles.codeLabel}>共有コード</span>
        <button className={styles.codeBtn} onClick={copyCode}>
          <span className={styles.code}>{householdId}</span>
          <span className={styles.copyIcon}>{copied ? '✓' : '📋'}</span>
        </button>
      </div>
      {!showConfirm ? (
        <button className={styles.leaveBtn} onClick={() => setShowConfirm(true)}>退出</button>
      ) : (
        <div className={styles.confirm}>
          <span>本当に？</span>
          <button className={styles.confirmYes} onClick={onLeave}>はい</button>
          <button className={styles.confirmNo} onClick={() => setShowConfirm(false)}>いいえ</button>
        </div>
      )}
    </div>
  )
}
