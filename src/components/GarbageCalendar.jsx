import { useState } from 'react'
import styles from './GarbageCalendar.module.css'

// 川崎市多摩区 登戸地区 ごみ収集スケジュール
// 参考: 川崎市公式サイト (確認・修正が必要な場合は川崎市のHPをご覧ください)
const GARBAGE_SCHEDULE = {
  // 0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土
  0: [], // 日曜
  1: [
    { type: 'plastic', label: 'プラスチック製\n容器包装', icon: '♻️', color: '#4ecdc4' },
  ],
  2: [
    { type: 'burnable', label: '燃えるごみ', icon: '🔥', color: '#ff6b6b' },
  ],
  3: [
    { type: 'resource', label: '資源物\n（缶・ビン・PET）', icon: '🗑️', color: '#f7a800', note: '第2・4水曜' },
    { type: 'paper', label: '古紙・古布', icon: '📰', color: '#90e0ef', note: '第1・3水曜' },
  ],
  4: [], // 木曜
  5: [
    { type: 'burnable', label: '燃えるごみ', icon: '🔥', color: '#ff6b6b' },
  ],
  6: [
    { type: 'noncombustible', label: '燃えないごみ', icon: '🪣', color: '#b8c0cc', note: '月1回 第3土曜' },
  ],
}

const GARBAGE_TYPES = {
  burnable: { label: '燃えるごみ', icon: '🔥', color: '#ff6b6b', desc: '生ごみ、紙くず、布類など' },
  noncombustible: { label: '燃えないごみ', icon: '🪣', color: '#b8c0cc', desc: '金属類、陶磁器、ガラスなど（月1回）' },
  plastic: { label: 'プラ容器包装', icon: '♻️', color: '#4ecdc4', desc: 'プラマーク付き容器・包装' },
  resource: { label: '資源物（缶・ビン・PET）', icon: '🗑️', color: '#f7a800', desc: '缶、ビン、ペットボトル（第2・4水曜）' },
  paper: { label: '古紙・古布', icon: '📰', color: '#90e0ef', desc: '新聞、雑誌、段ボール、古布（第1・3水曜）' },
}

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function getWeekOfMonth(date) {
  const day = date.getDate()
  return Math.ceil(day / 7)
}

function getTodayGarbage(date) {
  const dow = date.getDay()
  const week = getWeekOfMonth(date)
  const items = GARBAGE_SCHEDULE[dow] || []

  return items.filter(item => {
    if (item.type === 'resource') return week === 2 || week === 4
    if (item.type === 'paper') return week === 1 || week === 3
    if (item.type === 'noncombustible') return week === 3
    return true
  })
}

function getNextGarbageDays(fromDate, days = 7) {
  const result = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(fromDate)
    d.setDate(fromDate.getDate() + i)
    const items = getTodayGarbage(d)
    if (items.length > 0) {
      result.push({ date: new Date(d), items })
    }
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
    const items = getTodayGarbage(date)
    days.push({ date, items })
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

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isToday = (date) =>
    date &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  return (
    <div className={`card ${styles.garbageCard}`}>
      <div className="section-title">
        🗓️ ごみ出しカレンダー
      </div>

      {/* 今日のごみ */}
      <div className={styles.todayBox}>
        <div className={styles.todayLabel}>今日のごみ出し</div>
        {todayGarbage.length === 0 ? (
          <div className={styles.noGarbage}>
            <span>🐧</span>
            <span>今日はごみの日じゃないよ</span>
          </div>
        ) : (
          <div className={styles.todayItems}>
            {todayGarbage.map((item) => (
              <div
                key={item.type}
                className={styles.garbageTag}
                style={{ '--tag-color': item.color }}
              >
                <span>{item.icon}</span>
                <span>{item.label.replace('\n', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 直近スケジュール */}
      <div className={styles.upcoming}>
        <div className={styles.upcomingTitle}>直近のごみ出し予定</div>
        {nextDays.slice(0, 5).map(({ date, items }) => {
          const isT = isToday(date)
          const diff = Math.round((date - today) / 86400000)
          const label = diff === 0 ? '今日' : diff === 1 ? '明日' : `${diff}日後`
          return (
            <div key={date.toISOString()} className={`${styles.upcomingRow} ${isT ? styles.todayRow : ''}`}>
              <div className={styles.upcomingDate}>
                <span className={styles.upcomingDateNum}>
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
                <span className={styles.upcomingDow}>{DAYS_JA[date.getDay()]}</span>
                <span className={styles.upcomingDiff}>{label}</span>
              </div>
              <div className={styles.upcomingItems}>
                {items.map(item => (
                  <span
                    key={item.type}
                    className={styles.miniTag}
                    style={{ '--tag-color': item.color }}
                  >
                    {item.icon} {item.label.replace('\n', ' ')}
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
                    <span
                      key={item.type}
                      className={styles.dot}
                      style={{ background: item.color }}
                      title={item.label}
                    />
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
            <span className={styles.legendIcon}>{info.icon}</span>
            <span className={styles.legendLabel}>{info.label}</span>
          </div>
        ))}
      </div>

      <p className={styles.note}>
        ※ 川崎市多摩区 登戸地区のスケジュールです。<br />
        正確な情報は<strong>川崎市公式サイト</strong>でご確認ください。
      </p>
    </div>
  )
}
