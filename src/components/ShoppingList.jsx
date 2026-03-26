import { useState, useRef } from 'react'
import styles from './ShoppingList.module.css'
import { useSharedList } from '../hooks/useSharedList'
import HouseholdBadge from './HouseholdBadge'

const CATEGORIES = [
  { id: 'food', label: '食品', icon: '🍱' },
  { id: 'drink', label: '飲み物', icon: '🧃' },
  { id: 'daily', label: '日用品', icon: '🧴' },
  { id: 'other', label: 'その他', icon: '📦' },
]

const PENGUIN_ENCOURAGEMENT = [
  'かしこいお買い物だペン！',
  'リストが空だよ，何か追加するペン？',
  'ペタペタ歩いてお買い物ペン！',
]

export default function ShoppingList({ householdId, onLeaveHousehold }) {
  const { items, syncing, isOnline, addItem, updateItem, removeItem, clearDone } = useSharedList(householdId, 'shopping')
  const [inputText, setInputText] = useState('')
  const [inputCategory, setInputCategory] = useState('food')
  const [filter, setFilter] = useState('all')
  const [showDone, setShowDone] = useState(true)
  const inputRef = useRef(null)

  async function handleAdd() {
    const text = inputText.trim()
    if (!text) return
    await addItem({ text, category: inputCategory, done: false })
    setInputText('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  const filtered = items.filter(item => {
    if (!showDone && item.done) return false
    if (filter === 'all') return true
    return item.category === filter
  })

  const doneCount = items.filter(i => i.done).length
  const totalCount = items.length
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  return (
    <div className={`card ${styles.shoppingCard}`}>
      <div className="section-title">
        🛒 買い物リスト
        {syncing && <span className={styles.syncDot}>●</span>}
      </div>

      <HouseholdBadge householdId={householdId} onLeave={onLeaveHousehold} />

      {/* ペンギンメッセージ */}
      {totalCount === 0 && (
        <div className={styles.penguinMsg}>
          <span className={styles.penguinEmoji}>🐧</span>
          <span>{PENGUIN_ENCOURAGEMENT[0]}</span>
        </div>
      )}

      {/* 進捗バー */}
      {totalCount > 0 && (
        <div className={styles.progress}>
          <div className={styles.progressInfo}>
            <span>{doneCount}/{totalCount} 完了</span>
            <span>{progressPct}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          {progressPct === 100 && (
            <div className={styles.allDone}>🎉 全部そろったペン！ 🐧</div>
          )}
        </div>
      )}

      {/* 入力 */}
      <div className={styles.inputRow}>
        <select
          className={styles.categorySelect}
          value={inputCategory}
          onChange={e => setInputCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon}</option>
          ))}
        </select>
        <input
          ref={inputRef}
          className={`input-field ${styles.itemInput}`}
          type="text"
          placeholder="追加するものを入力…"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className={`btn-primary ${styles.addBtn}`} onClick={handleAdd}>
          追加
        </button>
      </div>

      {/* フィルター */}
      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          すべて
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`${styles.filterBtn} ${filter === cat.id ? styles.active : ''}`}
            onClick={() => setFilter(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
        <button
          className={`${styles.filterBtn} ${styles.toggleDone} ${!showDone ? styles.active : ''}`}
          onClick={() => setShowDone(v => !v)}
        >
          {showDone ? '✅ 完了を隠す' : '✅ 完了を表示'}
        </button>
      </div>

      {/* リスト */}
      <div className={styles.list}>
        {filtered.length === 0 && totalCount > 0 && (
          <div className={styles.emptyFilter}>該当するアイテムがないペン 🐧</div>
        )}
        {filtered.map(item => {
          const cat = CATEGORIES.find(c => c.id === item.category)
          return (
            <div
              key={item.id}
              className={`${styles.listItem} ${item.done ? styles.done : ''}`}
            >
              <button
                className={`${styles.checkBtn} ${item.done ? styles.checked : ''}`}
                onClick={() => updateItem(item.id, { done: !item.done })}
              >
                {item.done ? '✓' : ''}
              </button>
              <span className={styles.catIcon}>{cat?.icon}</span>
              <span className={styles.itemText}>{item.text}</span>
              <button className={styles.deleteBtn} onClick={() => removeItem(item.id)}>
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {doneCount > 0 && (
        <div className={styles.footer}>
          <button className="btn-danger" onClick={clearDone}>
            完了済みを削除 ({doneCount}件)
          </button>
        </div>
      )}
    </div>
  )
}
