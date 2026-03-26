import { useState } from 'react'
import styles from './Memo.module.css'
import { useSharedMemos } from '../hooks/useSharedMemos'
import HouseholdBadge from './HouseholdBadge'

const NOTE_COLORS = [
  { id: 'teal', bg: 'rgba(0,180,216,0.15)', border: 'rgba(0,180,216,0.3)' },
  { id: 'yellow', bg: 'rgba(247,168,0,0.15)', border: 'rgba(247,168,0,0.3)' },
  { id: 'green', bg: 'rgba(78,205,100,0.15)', border: 'rgba(78,205,100,0.3)' },
  { id: 'pink', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.3)' },
  { id: 'purple', bg: 'rgba(157,78,221,0.15)', border: 'rgba(157,78,221,0.3)' },
]

function formatDate(val) {
  if (!val) return ''
  const d = val.toDate ? val.toDate() : new Date(val)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Memo({ householdId, onLeaveHousehold }) {
  const { memos, syncing, saveMemo, deleteMemo } = useSharedMemos(householdId)
  const [editingMemo, setEditingMemo] = useState(null) // null | memo object
  const [isCreating, setIsCreating] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftColor, setDraftColor] = useState('teal')
  const [searchQuery, setSearchQuery] = useState('')

  function startCreate() {
    setIsCreating(true)
    setEditingMemo(null)
    setDraftTitle('')
    setDraftBody('')
    setDraftColor('teal')
  }

  function startEdit(memo) {
    setEditingMemo(memo)
    setIsCreating(false)
    setDraftTitle(memo.title)
    setDraftBody(memo.body)
    setDraftColor(memo.color)
  }

  async function handleSave() {
    const title = draftTitle.trim()
    const body = draftBody.trim()
    if (!title && !body) { cancel(); return }
    await saveMemo({
      id: editingMemo?.id ?? null,
      title: title || '無題のメモ',
      body,
      color: draftColor,
    })
    cancel()
  }

  function cancel() {
    setIsCreating(false)
    setEditingMemo(null)
  }

  const filtered = memos.filter(m => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return m.title?.toLowerCase().includes(q) || m.body?.toLowerCase().includes(q)
  })

  const getColorStyle = (colorId) => {
    const c = NOTE_COLORS.find(n => n.id === colorId) ?? NOTE_COLORS[0]
    return { background: c.bg, borderColor: c.border }
  }

  const showForm = isCreating || editingMemo !== null

  return (
    <div className={`card ${styles.memoCard}`}>
      <div className={styles.headerRow}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          📝 メモ
          {syncing && <span className={styles.syncDot}>●</span>}
        </div>
        {!showForm && (
          <button className={`btn-primary ${styles.newBtn}`} onClick={startCreate}>
            ＋ 新規
          </button>
        )}
      </div>

      <HouseholdBadge householdId={householdId} onLeave={onLeaveHousehold} />

      {/* 検索 */}
      {memos.length > 2 && !showForm && (
        <input
          className={`input-field ${styles.searchInput}`}
          type="text"
          placeholder="🔍 メモを検索…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      )}

      {/* 作成/編集フォーム */}
      {showForm && (
        <div className={styles.editForm} style={getColorStyle(draftColor)}>
          <div className={styles.colorPicker}>
            {NOTE_COLORS.map(c => (
              <button
                key={c.id}
                className={`${styles.colorBtn} ${draftColor === c.id ? styles.colorBtnActive : ''}`}
                style={{ background: c.border }}
                onClick={() => setDraftColor(c.id)}
              />
            ))}
          </div>
          <input
            className={`input-field ${styles.titleInput}`}
            type="text"
            placeholder="タイトル"
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className={`input-field ${styles.bodyInput}`}
            placeholder="メモの内容…"
            value={draftBody}
            onChange={e => setDraftBody(e.target.value)}
            rows={5}
          />
          <div className={styles.editActions}>
            <button className="btn-danger" onClick={cancel}>キャンセル</button>
            <button className="btn-primary" onClick={handleSave}>保存</button>
          </div>
        </div>
      )}

      {/* メモ一覧 */}
      {!showForm && (
        <>
          {filtered.length === 0 && memos.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.penguinIllust}>🐧</div>
              <p>メモはまだないペン</p>
              <p className={styles.emptyHint}>「＋ 新規」から追加しよう</p>
            </div>
          )}
          {filtered.length === 0 && memos.length > 0 && (
            <div className={styles.empty}>
              <span>🔍 見つからないペン…</span>
            </div>
          )}
          <div className={styles.memoGrid}>
            {filtered.map(memo => (
              <div
                key={memo.id}
                className={styles.memoNote}
                style={getColorStyle(memo.color)}
              >
                <div className={styles.noteHeader}>
                  <div className={styles.noteTitle}>{memo.title}</div>
                  <div className={styles.noteActions}>
                    <button className={styles.editBtn} onClick={() => startEdit(memo)}>✏️</button>
                    <button className={styles.deleteBtn} onClick={() => deleteMemo(memo.id)}>🗑️</button>
                  </div>
                </div>
                {memo.body && (
                  <div className={styles.noteBody}>{memo.body}</div>
                )}
                <div className={styles.noteDate}>{formatDate(memo.updatedAt)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
