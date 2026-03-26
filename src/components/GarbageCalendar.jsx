import { useState } from 'react'
import styles from './GarbageCalendar.module.css'

// ========================================================
// 川崎市多摩区 登戸地区 ごみ収集スケジュール
// 出典: 川崎市公式「収集日一覧（多摩区・麻生区）」
// https://www.city.kawasaki.jp/300/page/0000012577.html
// 最終更新: 2026年1月22日
// ※ 正確な情報は川崎市公式サイトまたは
//   ごみ分別アプリでご確認ください
// ========================================================

// 登戸地区のスケジュール定義
// 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
const SCHEDULE = {
  1: [ // 月曜
    { type: 'burnable', label: '燃えるごみ', icon: '🔥', color: '#ff6b6b' },
    {
      type: 'noncombustible', label: '燃えないごみ', icon: '🧱', color: '#b8c0cc',
      weekFilter: (week) => week === 4, // 第4月曜
    },
    {
      type: 'metal', label: '小物金属', icon: '🔧', color: '#9e9e9e',
      weekFilter: (week) => week === 2, // 第2月曜
    },
  ],
  2: [ // 火曜
    { type: 'plastic', label: 'プラ容器包装', icon: '♻️', color: '#4ecdc4' },
  ],
  3: [ // 水曜
    {
      type: 'resource_can', label: '缶・ビン・PET', icon: '🥤', color: '#f7a800',
      weekFilter: (week) => week === 2 || week === 4, // 第2・4水曜
    },
    {
      type: 'paper', label: '古紙・古布', icon: '📰', color: '#90e0ef',
      weekFilter: (week) => week === 1 || week === 3, // 第1・3水曜
    },
  ],
  4: [ // 木曜
    { type: 'burnable', label: '燃えるごみ', icon: '🔥', color: '#ff6b6b' },
  ],
  5: [], // 金曜 - なし
  6: [], // 土曜 - なし
  0: [], // 日曜 - なし
}

const GARBAGE_TYPES = {
  burnable:        { label: '燃えるごみ',     icon: '🔥', color: '#ff6b6b' },
  noncombustible:  { label: '燃えないごみ',   icon: '🧱', color: '#b8c0cc' },
  plastic:         { label: 'プラ容器包装',   icon: '♻️', color: '#4ecdc4' },
  resource_can:    { label: '缶・ビン・PET',  icon: '🥤', color: '#f7a800' },
  paper:           { label: '古紙・古布',      icon: '📰', color: '#90e0ef' },
  metal:           { label: '小物金属',        icon: '🔧', color: '#9e9e9e' },
}

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

function getWeekOfMonth(date) {
  return Math.ceil(date.getDate() / 7)
}

function getTodayGarbage(date) {
  const dow = date.getDay()
  const week = getWeekOfMonth(date)
  const items = SCHEDULE[dow] ?? []
  return items.filter(item => !item.weekFilter || item.weekFilter(week))
}

function getNextGarbageDays(fromDate, count = 7) {
  const result = []
  for (let i = 0; i <= 14 && result.length < count; i++) {
    const d = new Date(fromDate)
    d.setDate(fromDate.getDate() + i)
    const items = getTodayGarbage(d)
    if (items.length > 0) result.push({ date: new Date(d), items })
  }
  return result
}

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const days = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    days.push({ date, items: getTodayGarbage(date) })
  }
  return days
}

export default function GarbageCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const calDays = buildCalendar(viewYear, viewMonth)
  const todayGarbage = getTodayGarbage(today)
  const nextDays = getNextGarbageDays(today)

  const isToday = (d) =>
    d &&
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // 公式リンクを開く
  function openOfficialSite() {
    window.open('https://www.city.kawasaki.jp/300/page/0000012577.html', '_blank')
  }
  function openOfficialApp() {
    // iOS App Store
    window.open('https://apps.apple.com/jp/app/%E5%B7%9D%E5%B4%8E%E5%B8%82%E3%81%94%E3%81%BF%E5%88%86%E5%88%A5%E3%82%A2%E3%83%97%E3%83%AA/id1074173358', '_blank')
  }

  return (
    <div className={`card ${styles.garbageCard}`}>
      <div className="section-title">🗓️ ごみ出しカレンダー</div>

      {/* 今日のごみ */}
      <div className={styles.todayBox}>
        <div className={styles.todayLabel}>今日のごみ出し</div>
        {todayGarbage.length === 0 ? (
          <div className={styles.noGarbage}>
            <span>🐧</span><span>今日はごみの日じゃないよ</span>
          </div>
        ) : (
          <div className={styles.todayItems}>
            {todayGarbage.map(item => (
              <div key={item.type} className={styles.garbageTag} style={{ '--tag-color': item.color }}>
                <span>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 直近スケジュール */}
      <div className={styles.upcoming}>
        <div className={styles.upcomingTitle}>直近のごみ出し予定</div>
        {nextDays.slice(0, 5).map(({ date, items }) => {
          const diff = Math.round((date - today) / 86400000)
          const label = diff === 0 ? '今日' : diff === 1 ? '明日' : `${diff}日後`
          return (
            <div key={date.toISOString()} className={`${styles.upcomingRow} ${isToday(date) ? styles.todayRow : ''}`}>
              <div className={styles.upcomingDate}>
                <span className={styles.upcomingDateNum}>{date.getMonth() + 1}/{date.getDate()}</span>
                <span className={styles.upcomingDow}>{DAYS_JA[date.getDay()]}</span>
                <span className={styles.upcomingDiff}>{label}</span>
              </div>
              <div className={styles.upcomingItems}>
                {items.map(item => (
                  <span key={item.type} className={styles.miniTag} style={{ '--tag-color': item.color }}>
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* カレンダー */}
      <div className={styles.calNav}>
        <button className={styles.navBtn} onClick={prevMonth}>◀</button>
        <span className={styles.calTitle}>{viewYear}年 {MONTHS_JA[viewMonth]}</span>
        <button className={styles.navBtn} onClick={nextMonth}>▶</button>
      </div>

      <div className={styles.calGrid}>
        {DAYS_JA.map((d, i) => (
          <div key={d} className={`${styles.calDow} ${i === 0 ? styles.sun : ''} ${i === 6 ? styles.sat : ''}`}>
            {d}
          </div>
        ))}
        {calDays.map((day, i) => (
          <div
            key={i}
            className={`${styles.calCell} ${!day ? styles.empty : ''} ${day && isToday(day.date) ? styles.calToday : ''}`}
          >
            {day && (
              <>
                <span className={`${styles.calDate} ${day.date.getDay() === 0 ? styles.sun : ''} ${day.date.getDay() === 6 ? styles.sat : ''}`}>
                  {day.date.getDate()}
                </span>
                <div className={styles.calDots}>
                  {day.items.map(item => (
                    <span key={item.type} className={styles.dot} style={{ background: item.color }} title={item.label} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div className={styles.legend}>
        {Object.entries(GARBAGE_TYPES).map(([key, info]) => (
          <div key={key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: info.color }} />
            <span>{info.icon}</span>
            <span className={styles.legendLabel}>{info.label}</span>
          </div>
        ))}
      </div>

      {/* 公式リンク */}
      <div className={styles.officialLinks}>
        <button className={styles.officialBtn} onClick={openOfficialSite}>
          <span>🏛️</span>
          <span>川崎市公式 収集日一覧を確認</span>
        </button>
        <button className={styles.officialBtn} onClick={openOfficialApp}>
          <span>📱</span>
          <span>川崎市ごみ分別アプリ</span>
        </button>
      </div>

      <p className={styles.note}>
        ※ 登戸地区の収集スケジュールです。<br />
        住所によって異なる場合があります。<br />
        正確な情報は<strong>川崎市公式サイト</strong>でご確認ください。
      </p>
    </div>
  )
}
