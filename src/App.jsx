import { useState, useEffect, useRef } from 'react'
import { db, auth, hasConfig } from './firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from 'firebase/firestore'

// --- Constants ---
const NOBORITO_LAT = 35.6207
const NOBORITO_LON = 139.5620

const WEATHER_ICONS = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
}

const WEATHER_LABELS = {
  0: '快晴', 1: '晴れ', 2: '一部曇り', 3: '曇り',
  45: '霧', 48: '霧',
  51: '小雨', 53: '雨', 55: '強い雨',
  61: '小雨', 63: '雨', 65: '大雨',
  71: '小雪', 73: '雪', 75: '大雪',
  80: 'にわか雨', 81: 'にわか雨', 82: '激しい雨',
  95: '雷雨', 96: '雷雨(雹)', 99: '雷雨(雹)',
}

// --- Garbage Collection Logic (多摩区登戸) ---
function getGarbageInfo(date) {
  const day = date.getDay()
  const weekOfMonth = Math.ceil(date.getDate() / 7)

  switch (day) {
    case 1: case 4:
      return { type: '普通ゴミ', color: '#22C55E', icon: '🗑️' }
    case 3:
      return { type: '資源ゴミ', color: '#3B82F6', icon: '♻️' }
    case 5:
      return { type: 'プラスチック', color: '#EAB308', icon: '🧴' }
    case 6:
      return { type: '空き缶・ペット', color: '#F97316', icon: '🥫' }
    case 2:
      if (weekOfMonth === 1 || weekOfMonth === 3) {
        return { type: '小物金属', color: '#6B7280', icon: '🔧' }
      }
      return null
    default:
      return null
  }
}

function getNextGarbageDay(fromDate) {
  for (let i = 1; i <= 7; i++) {
    const next = new Date(fromDate)
    next.setDate(next.getDate() + i)
    const info = getGarbageInfo(next)
    if (info) return { date: next, ...info }
  }
  return null
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'おやすみ前かな？ 明日もいい日に。'
  if (h < 10) return 'おはよう！ いい一日になりますように。'
  if (h < 14) return 'お昼だね。ちょっと一息つこう。'
  if (h < 18) return '午後もがんばろう！'
  if (h < 21) return 'おつかれさま。ゆっくりしてね。'
  return 'そろそろおやすみの時間だね。'
}

// --- Penguin SVG (small accent) ---
function PenguinIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <ellipse cx="32" cy="36" rx="18" ry="22" fill="#0C2D48" />
      <ellipse cx="32" cy="38" rx="12" ry="16" fill="#F2F7FA" />
      <circle cx="32" cy="16" r="12" fill="#0C2D48" />
      <circle cx="27" cy="14" r="2.5" fill="#F2F7FA" />
      <circle cx="37" cy="14" r="2.5" fill="#F2F7FA" />
      <circle cx="27.8" cy="14" r="1.2" fill="#0C2D48" />
      <circle cx="37.8" cy="14" r="1.2" fill="#0C2D48" />
      <polygon points="32,18 28,22 36,22" fill="#FDBA74" />
      <ellipse cx="25" cy="57" rx="5" ry="2.5" fill="#FDBA74" />
      <ellipse cx="39" cy="57" rx="5" ry="2.5" fill="#FDBA74" />
    </svg>
  )
}

// --- Main App (Single Page Dashboard) ---
function App() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [memos, setMemos] = useState([])
  const [memoText, setMemoText] = useState('')
  const [showMemoPanel, setShowMemoPanel] = useState(false)
  const memoEndRef = useRef(null)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${NOBORITO_LAT}&longitude=${NOBORITO_LON}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&forecast_days=3`
    )
      .then((r) => r.json())
      .then((data) => { setWeather(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!hasConfig || !db) return
    const q = query(
      collection(db, 'artifacts', 'noborito-tsumugi', 'public', 'data', 'memos'),
      orderBy('createdAt', 'asc'),
      limit(50)
    )
    return onSnapshot(q, (snap) => {
      setMemos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [])

  useEffect(() => {
    memoEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [memos])

  const sendMemo = async () => {
    if (!memoText.trim() || !hasConfig || !db) return
    await addDoc(
      collection(db, 'artifacts', 'noborito-tsumugi', 'public', 'data', 'memos'),
      {
        content: memoText.trim(),
        createdAt: serverTimestamp(),
        author: auth?.currentUser?.uid || 'anonymous',
      }
    )
    setMemoText('')
  }

  const now = new Date()
  const todayGarbage = getGarbageInfo(now)
  const nextGarbage = getNextGarbageDay(now)
  const current = weather?.current
  const daily = weather?.daily

  return (
    <div className="min-h-dvh bg-arctic-white">
      {/* ===== Header ===== */}
      <header className="bg-gradient-to-br from-deep-blue to-deep-blue-light text-white px-5 pt-4 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <PenguinIcon size={18} />
            <span className="text-xs font-medium tracking-wide opacity-70">登戸つむぎ</span>
          </div>

          {/* Weather hero inside header */}
          {loading ? (
            <div className="flex items-center gap-3 h-16">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              <span className="text-sm opacity-60">天気を取得中...</span>
            </div>
          ) : current ? (
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none">{WEATHER_ICONS[current.weather_code] || '🌡'}</span>
                <div>
                  <p className="text-3xl font-light leading-none tracking-tight">
                    {Math.round(current.temperature_2m)}<span className="text-lg">°C</span>
                  </p>
                  <p className="text-xs opacity-60 mt-0.5">
                    {WEATHER_LABELS[current.weather_code] || '—'} ・ 湿度{current.relative_humidity_2m}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] opacity-50">{formatDate(now)}</p>
                <p className="text-[11px] opacity-50">風速 {current.wind_speed_10m}km/h</p>
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-50">天気情報を取得できませんでした</p>
          )}

          {/* 3-day mini forecast */}
          {daily && (
            <div className="flex gap-2 mt-4">
              {daily.time.map((day, i) => {
                const d = new Date(day + 'T00:00:00')
                return (
                  <div key={day} className="flex-1 text-center bg-white/10 rounded-xl py-2 px-1">
                    <p className="text-[10px] opacity-60">{i === 0 ? '今日' : DAY_NAMES[d.getDay()]}</p>
                    <p className="text-lg leading-none my-0.5">{WEATHER_ICONS[daily.weather_code[i]] || '🌡'}</p>
                    <p className="text-[10px]">
                      <span className="text-orange-200">{Math.round(daily.temperature_2m_max[i])}°</span>
                      <span className="opacity-40"> / </span>
                      <span className="text-blue-200">{Math.round(daily.temperature_2m_min[i])}°</span>
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </header>

      {/* ===== Dashboard Body ===== */}
      <main className="max-w-lg mx-auto px-4 -mt-3 pb-8 space-y-3">

        {/* --- Garbage Card --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
          <div className="p-4">
            <div className="flex items-center gap-3">
              {todayGarbage ? (
                <>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: todayGarbage.color + '18' }}
                  >
                    {todayGarbage.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">今日のゴミ出し</p>
                    <p className="text-base font-bold text-deep-blue leading-snug">{todayGarbage.type}</p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: todayGarbage.color }}
                  />
                </>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
                    —
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">今日のゴミ出し</p>
                    <p className="text-base font-medium text-gray-300">収集なし</p>
                  </div>
                </>
              )}
            </div>
          </div>
          {nextGarbage && (
            <div className="border-t border-gray-50 px-4 py-2.5 flex items-center gap-2 bg-gray-50/50">
              <span className="text-sm">{nextGarbage.icon}</span>
              <p className="text-[11px] text-gray-500">
                次回 <span className="font-medium text-deep-blue">{formatDate(nextGarbage.date)}</span> {nextGarbage.type}
              </p>
            </div>
          )}
        </div>

        {/* --- Quick Actions Grid --- */}
        <div className="grid grid-cols-2 gap-3">
          {/* Train Links */}
          <a
            href="https://www.odakyu.jp/cgi-bin/user/emg/emergency_bbs.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover block"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-xs">🔵</span>
              <span className="text-xs font-bold text-deep-blue">小田急線</span>
            </div>
            <p className="text-[10px] text-gray-400">運行情報を確認</p>
          </a>
          <a
            href="https://traininfo.jreast.co.jp/train_info/kanto.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover block"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-6 h-6 rounded-md bg-yellow-50 flex items-center justify-center text-xs">🟡</span>
              <span className="text-xs font-bold text-deep-blue">南武線</span>
            </div>
            <p className="text-[10px] text-gray-400">運行情報を確認</p>
          </a>
        </div>

        {/* --- Shared Memo Card --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowMemoPanel(!showMemoPanel)}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-deep-blue/5 flex items-center justify-center text-xs">📝</span>
              <span className="text-xs font-bold text-deep-blue">共有メモ</span>
              {memos.length > 0 && (
                <span className="bg-beak-orange text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {memos.length}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-300 transition-transform ${showMemoPanel ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMemoPanel && (
            <div className="border-t border-gray-50">
              {!hasConfig && (
                <div className="mx-4 mt-3 bg-beak-orange/8 border border-beak-orange/20 rounded-lg p-3 text-[11px] text-deep-blue/70">
                  .env に VITE_FIREBASE_* を設定するとリアルタイム同期が有効になります。
                </div>
              )}

              {/* Messages */}
              <div className="max-h-64 overflow-y-auto px-4 py-3 space-y-2">
                {memos.length === 0 && (
                  <div className="text-center py-6 text-gray-300 text-xs">
                    <PenguinIcon size={24} />
                    <p className="mt-1">まだメモがありません</p>
                  </div>
                )}
                {memos.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                      m.author === auth?.currentUser?.uid
                        ? 'ml-auto bg-deep-blue text-white rounded-br-sm'
                        : 'mr-auto bg-gray-50 text-deep-blue rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    {m.createdAt && (
                      <p className="text-[9px] opacity-40 mt-1">
                        {new Date(m.createdAt.seconds * 1000).toLocaleString('ja-JP', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                ))}
                <div ref={memoEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 pb-3 flex gap-2 items-end">
                <input
                  type="text"
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMemo() }}
                  placeholder="メモを入力..."
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-deep-blue placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-beak-orange/30 focus:border-beak-orange/50 transition-shadow"
                />
                <button
                  onClick={sendMemo}
                  disabled={!memoText.trim()}
                  className="bg-deep-blue text-white rounded-xl px-3.5 py-2 text-[13px] font-medium disabled:opacity-30 active:scale-95 transition-all hover:bg-deep-blue-light"
                >
                  送信
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- Greeting Footer --- */}
        <div className="flex items-center gap-2 px-1 pt-1">
          <PenguinIcon size={16} />
          <p className="text-[11px] text-gray-400 italic">{getGreeting()}</p>
        </div>
      </main>
    </div>
  )
}

export default App
