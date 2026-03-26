import { useState } from 'react'
import Weather from './components/Weather'
import GarbageCalendar from './components/GarbageCalendar'
import ShoppingList from './components/ShoppingList'
import Memo from './components/Memo'
import HouseholdSetup from './components/HouseholdSetup'
import styles from './App.module.css'
import { useHousehold } from './hooks/useHousehold'

const TABS = [
  { id: 'weather', label: '天気', icon: '☀️' },
  { id: 'garbage', label: 'ごみ', icon: '🗓️' },
  { id: 'shopping', label: '買い物', icon: '🛒' },
  { id: 'memo', label: 'メモ', icon: '📝' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('weather')
  const { householdId, createHousehold, joinHousehold, leaveHousehold } = useHousehold()

  if (!householdId) {
    return (
      <HouseholdSetup
        onCreate={createHousehold}
        onJoin={joinHousehold}
      />
    )
  }

  const sharedProps = {
    householdId,
    onLeaveHousehold: leaveHousehold,
  }

  return (
    <div className={styles.app}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.penguinLogo}>🐧</span>
            <div>
              <div className={styles.appTitle}>登戸暮らし</div>
              <div className={styles.appSubtitle}>川崎市多摩区 登戸</div>
            </div>
          </div>
          <div className={styles.headerDecor}>
            <span>❄️</span>
            <span>🐧</span>
            <span>❄️</span>
          </div>
        </div>
      </header>

      {/* デスクトップ: グリッドレイアウト */}
      <main className={styles.desktopLayout}>
        <div className={styles.column}>
          <Weather />
          <GarbageCalendar />
        </div>
        <div className={styles.column}>
          <ShoppingList {...sharedProps} />
          <Memo {...sharedProps} />
        </div>
      </main>

      {/* モバイル: タブ切り替え */}
      <main className={styles.mobileLayout}>
        <div className={styles.mobileContent}>
          {activeTab === 'weather' && <Weather />}
          {activeTab === 'garbage' && <GarbageCalendar />}
          {activeTab === 'shopping' && <ShoppingList {...sharedProps} />}
          {activeTab === 'memo' && <Memo {...sharedProps} />}
        </div>
        <nav className={styles.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* フッター (デスクトップのみ) */}
      <footer className={styles.footer}>
        <span>🐧 登戸暮らし</span>
        <span>·</span>
        <span>川崎市多摩区 登戸 で二人暮らし</span>
        <span>·</span>
        <span>天気データ: Open-Meteo</span>
      </footer>
    </div>
  )
}
