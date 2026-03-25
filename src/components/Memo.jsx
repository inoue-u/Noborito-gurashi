import { useState, useEffect } from 'react'
import styles from './Memo.module.css'

const STORAGE_KEY = 'noborito-memos'

const NOTE_COLORS = [
  { id: 'teal', bg: 'rgba(0,180,216,0.15)', border: 'rgba(0,180,216,0.3)', label: '青' },
  { id: 'yellow', bg: 'rgba(247,168,0,0.15)', border: 'rgba(247,168,0,0.3)', label: '黄' },
  { id: 'green', bg: 'rgba(78,205,100,0.15)', border: 'rgba(78,205,100,0.3)', label: '緑' },
  { id: 'pink', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.3)', label: 'ピンク' },
  { id: 'purple', bg: 'rgba(157,78,221,0.15)', border: 'rgba(157,78,221,0.3)', label: '紫' },
]

function loadMemos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMemos(memos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos))
}

function formatDate(isoStr) {
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Memo() {
  const [memos, setMemos] = useState(loadMemos)
  const [editingId, setEditingId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newColor, setNewColor] = useState('teal')
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { saveMemos(memos) }, [memos])

  function startCreate() {
    setIsCreating(true)
    setNewTitle('')
    setNewBody('')
    setNewColor('teal')
    setEditingId(null)
  }

  function saveNew() {
    const title = newTitle.trim()
    const body = newBody.trim()
    if (!title && !body) { setIsCreating(false); return }
    const memo = {
      id: Date.now(),
      title: title || '無題のメモ',
      body,
      color: newColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMemos(prev => [memo, ...prev])
    setIsCreating(false)
  }

  function startEdit(memo) {
    setEditingId(memo.id)
    setNewTitle(memo.title)
    setNewBody(memo.body)
    setNewColor(memo.color)
    setIsCreating(false)
  }

  function saveEdit() {
    setMemos(prev => prev.map(m =>
      m.id === editingId
        ? { ...m, title: newTitle.trim() || '無題のメモ', body: newBody.trim(), color: newColor, updatedAt: new Date().toISOString() }
        : m
    ))
    setEditingId(null)
  }

  function deleteMemo(id) {
    setMemos(prev => prev.filter(m => m.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
  }

  const filtered = memos.filter(m => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q)
  })

  const getColorStyle = (colorId) => {
    const c = NOTE_COLORS.find(n => n.id === colorId) ?? NOTE_COLORS[0]
    return { background: c.bg, borderColor: c.border }
  }

  return (
    <div className={`card ${styles.memoCard}`}>
      <div className={styles.headerRow}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          📝 メモ
        </div>
        {!isCreating && !editingId && (
          <button className={`btn-primary ${styles.newBtn}`} onClick={startCreate}>
            ＋ 新規
          </button>
        )}
      </div>

      {/* 検索 */}
      {memos.length > 2 && !isCreating && !editingId && (
        <input
          className={`input-field ${styles.searchInput}`}
          type="text"
          placeholder="🔍 メモを検索…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      )}

      {/* 作成/編集フォーム */}
      {(isCreating || editingId !== null) && (
        <div className={`${styles.editForm}`} style={getColorStyle(newColor)}>
          {/* カラー選択 */}
          <div className={styles.colorPicker}>
            {NOTE_COLORS.map(c => (
              <button
                key={c.id}
                className={`${styles.colorBtn} ${newColor === c.id ? styles.colorBtnActive : ''}`}
                style={{ background: c.border }}
                onClick={() => setNewColor(c.id)}
                title={c.label}
              />
            ))}
          </div>

          <input
            className={`input-field ${styles.titleInput}`}
            type="text"
            placeholder="タイトル"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className={`input-field ${styles.bodyInput}`}
            placeholder="メモの内容…"
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            rows={5}
          />
          <div className={styles.editActions}>
            <button className="btn-danger" onClick={cancelEdit}>
              キャンセル
            </button>
            <button className="btn-primary" onClick={isCreating ? saveNew : saveEdit}>
              保存
            </button>
          </div>
        </div>
      )}

      {/* メモ一覧 */}
      {!isCreating && editingId === null && (
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
                    <button
                      className={styles.editBtn}
                      onClick={() => startEdit(memo)}
                      title="編集"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteMemo(memo.id)}
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                {memo.body && (
                  <div className={styles.noteBody}>{memo.body}</div>
                )}
                <div className={styles.noteDate}>
                  {formatDate(memo.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
