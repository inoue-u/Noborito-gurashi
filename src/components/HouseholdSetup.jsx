import { useState } from 'react'
import styles from './HouseholdSetup.module.css'

export default function HouseholdSetup({ onCreate, onJoin }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')

  function handleCreate() {
    onCreate()
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) {
      setError('コードが短すぎます')
      return
    }
    const ok = onJoin(code)
    if (!ok) setError('無効なコードです')
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.penguinHero}>
          <span className={styles.penguin1}>🐧</span>
          <span className={styles.penguin2}>🐧</span>
        </div>
        <h1 className={styles.title}>登戸暮らし</h1>
        <p className={styles.subtitle}>二人でつかう生活アプリ</p>

        {!mode && (
          <div className={styles.buttons}>
            <button className={styles.btnCreate} onClick={() => { setMode('create'); handleCreate() }}>
              <span>🏠</span>
              <span>新しく始める</span>
              <span className={styles.btnHint}>コードを発行して相手を招待</span>
            </button>
            <button className={styles.btnJoin} onClick={() => setMode('join')}>
              <span>🔑</span>
              <span>コードで参加する</span>
              <span className={styles.btnHint}>相手から受け取ったコードを入力</span>
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className={styles.joinForm}>
            <p className={styles.joinLabel}>招待コードを入力</p>
            <input
              className={styles.codeInput}
              type="text"
              placeholder="例: ABC123"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
              maxLength={8}
              autoFocus
              autoCapitalize="characters"
            />
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.joinActions}>
              <button className={styles.btnBack} onClick={() => { setMode(null); setError('') }}>
                戻る
              </button>
              <button className={styles.btnCreate} onClick={handleJoin} style={{ flex: 1 }}>
                参加する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
