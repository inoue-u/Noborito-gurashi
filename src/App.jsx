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

// --- Garbage Collection Logic ---
function getGarbageInfo(date) {
  const day = date.getDay() // 0=Sun, 1=Mon...
  const weekOfMonth = Math.ceil(date.getDate() / 7)

  switch (day) {
    case 1: // Monday
    case 4: // Thursday
      return { type: '普通ゴミ', color: 'bg-green-500', icon: '🗑️' }
    case 3: // Wednesday
      return { type: '資源ゴミ', color: 'bg-blue-500', icon: '♻️' }
    case 5: // Friday
      return { type: 'プラスチック', color: 'bg-yellow-500', icon: '🧴' }
    case 6: // Saturday
      return { type: '空き缶・ペット', color: 'bg-red-400', icon: '🥫' }
    case 2: // Tuesday
      if (weekOfMonth === 1 || weekOfMonth === 3) {
        return { type: '小物金属', color: 'bg-gray-500', icon: '🔧' }
      }
      return { type: '収集なし', color: 'bg-snow-gray', icon: '—' }
    default:
      return { type: '収集なし', color: 'bg-snow-gray', icon: '—' }
  }
}

function getNextGarbageDay(fromDate) {
  for (let i = 1; i <= 7; i++) {
    const next = new Date(fromDate)
    next.setDate(next.getDate() + i)
    const info = getGarbageInfo(next)
    if (info.type !== '収集なし') {
      return { date: next, ...info }
    }
  }
  return null
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_NAMES[d.getDay()]})`
}

// --- Penguin SVG Component ---
function PenguinIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
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

// --- Tabs ---
const TABS = [
  { id: 'home', label: 'ホーム', icon: '🏠' },
  { id: 'memo', label: 'メモ', icon: '📝' },
  { id: 'traffic', label: '交通', icon: '🚃' },
]

// --- Main App ---
function App() {
  const [tab, setTab] = useState('home')
  const [weather, setWeather] = useState(null)
  const [memos, setMemos] = useState([])
  const [memoText, setMemoText] = useState('')
  const [loading, setLoading] = useState(true)
  const memoEndRef = useRef(null)

  // Fetch weather
  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${NOBORITO_LAT}&longitude=${NOBORITO_LON}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&forecast_days=3`
    )
      .then((r) => r.json())
      .then((data) => {
        setWeather(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Firestore memos listener
  useEffect(() => {
    if (!hasConfig || !db) return
    const q = query(
      collection(db, 'artifacts', 'noborito-tsumugi', 'public', 'data', 'memos'),
      orderBy('createdAt', 'asc'),
      limit(50)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMemos(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Auto-scroll memos
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

  return (
    <div className="min-h-dvh bg-arctic-white flex flex-col pb-24">
      {/* Header */}
      <header className="bg-deep-blue text-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-2">
          <PenguinIcon className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold leading-tight">登戸つむぎ</h1>
            <p className="text-[10px] text-ice-blue opacity-80">ペンギン・エディション</p>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-4">
        {tab === 'home' && (
          <HomeTab
            weather={weather}
            loading={loading}
            todayGarbage={todayGarbage}
            nextGarbage={nextGarbage}
            now={now}
          />
        )}
        {tab === 'memo' && (
          <MemoTab
            memos={memos}
            memoText={memoText}
            setMemoText={setMemoText}
            sendMemo={sendMemo}
            memoEndRef={memoEndRef}
          />
        )}
        {tab === 'traffic' && <TrafficTab />}
      </main>

      {/* Tab Bar - Glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/70 border-t border-snow-gray/50 pb-[max(env(safe-area-inset-bottom),8px)]">
        <div className="flex justify-around max-w-md mx-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center py-2 px-4 text-xs transition-colors ${
                tab === t.id
                  ? 'text-deep-blue font-bold'
                  : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="mt-0.5">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

// --- Home Tab ---
function HomeTab({ weather, loading, todayGarbage, nextGarbage, now }) {
  const currentWeather = weather?.current
  const daily = weather?.daily

  return (
    <div className="space-y-4">
      {/* Weather Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-snow-gray/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-deep-blue">登戸の天気</h2>
          <span className="text-[10px] text-gray-400">{formatDate(now)}</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin w-6 h-6 border-2 border-deep-blue border-t-transparent rounded-full" />
          </div>
        ) : currentWeather ? (
          <>
            <div className="flex items-center gap-4">
              <span className="text-5xl">
                {WEATHER_ICONS[currentWeather.weather_code] || '🌡'}
              </span>
              <div>
                <p className="text-3xl font-bold text-deep-blue">
                  {Math.round(currentWeather.temperature_2m)}°C
                </p>
                <p className="text-sm text-gray-500">
                  {WEATHER_LABELS[currentWeather.weather_code] || '不明'}
                </p>
              </div>
              <div className="ml-auto text-right text-xs text-gray-400 space-y-1">
                <p>湿度 {currentWeather.relative_humidity_2m}%</p>
                <p>風速 {currentWeather.wind_speed_10m}km/h</p>
              </div>
            </div>
            {/* 3-day forecast */}
            {daily && (
              <div className="mt-4 pt-3 border-t border-snow-gray/50 grid grid-cols-3 gap-2 text-center">
                {daily.time.map((day, i) => {
                  const d = new Date(day + 'T00:00:00')
                  return (
                    <div key={day} className="text-xs">
                      <p className="text-gray-400">
                        {i === 0 ? '今日' : formatDate(d)}
                      </p>
                      <p className="text-2xl my-1">
                        {WEATHER_ICONS[daily.weather_code[i]] || '🌡'}
                      </p>
                      <p className="text-deep-blue font-medium">
                        <span className="text-red-400">
                          {Math.round(daily.temperature_2m_max[i])}°
                        </span>
                        {' / '}
                        <span className="text-blue-400">
                          {Math.round(daily.temperature_2m_min[i])}°
                        </span>
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">天気情報を取得できませんでした</p>
        )}
      </div>

      {/* Garbage Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-snow-gray/50">
        <h2 className="text-sm font-bold text-deep-blue mb-3">ゴミ出し情報</h2>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl ${todayGarbage.color} flex items-center justify-center text-2xl text-white`}
          >
            {todayGarbage.icon}
          </div>
          <div>
            <p className="text-xs text-gray-400">今日のゴミ</p>
            <p className="text-lg font-bold text-deep-blue">
              {todayGarbage.type}
            </p>
          </div>
        </div>
        {nextGarbage && (
          <div className="mt-3 pt-3 border-t border-snow-gray/50 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${nextGarbage.color} flex items-center justify-center text-sm text-white`}
            >
              {nextGarbage.icon}
            </div>
            <div className="text-xs">
              <span className="text-gray-400">次回: </span>
              <span className="text-deep-blue font-medium">
                {formatDate(nextGarbage.date)} — {nextGarbage.type}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Penguin greeting */}
      <div className="flex items-end gap-3 px-2">
        <PenguinIcon className="w-12 h-12 shrink-0" />
        <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm p-3 border border-snow-gray/50 text-sm text-deep-blue">
          {getGreeting()}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'こんな時間まで起きてるの？ 早く寝ないとペンギンに怒られるよ。'
  if (h < 10) return 'おはよう！ 今日も登戸から素敵な一日を始めよう。'
  if (h < 12) return 'そろそろお昼だね。登戸の美味しいお店に行く？'
  if (h < 15) return 'お昼過ぎだね。午後もがんばろう！'
  if (h < 18) return 'そろそろ夕方だね。帰り道、気をつけてね。'
  if (h < 21) return 'お疲れさま！ ゆっくり休んでね。'
  return 'もうこんな時間。今日もお疲れさま。おやすみなさい。'
}

// --- Memo Tab ---
function MemoTab({ memos, memoText, setMemoText, sendMemo, memoEndRef }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMemo()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)]">
      <h2 className="text-sm font-bold text-deep-blue mb-3">共有メモ</h2>

      {!hasConfig && (
        <div className="bg-beak-orange/10 border border-beak-orange/30 rounded-xl p-4 mb-3 text-xs text-deep-blue">
          <p className="font-bold mb-1">Firebase未設定</p>
          <p>
            .env に VITE_FIREBASE_* を設定するとリアルタイム共有メモが使えます。
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {memos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
            <PenguinIcon className="w-16 h-16 opacity-30 mb-2" />
            <p>まだメモがありません</p>
          </div>
        )}
        {memos.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl p-3 text-sm ${
              m.author === auth?.currentUser?.uid
                ? 'ml-auto bg-deep-blue text-white rounded-br-sm'
                : 'mr-auto bg-white text-deep-blue border border-snow-gray/50 rounded-bl-sm'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{m.content}</p>
            {m.createdAt && (
              <p className="text-[10px] opacity-50 mt-1">
                {new Date(m.createdAt.seconds * 1000).toLocaleString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        ))}
        <div ref={memoEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メモを入力..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-snow-gray bg-white px-4 py-3 text-sm text-deep-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-beak-orange/50 focus:border-beak-orange"
        />
        <button
          onClick={sendMemo}
          disabled={!memoText.trim()}
          className="bg-deep-blue text-white rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-40 active:scale-95 transition-transform"
        >
          送信
        </button>
      </div>
    </div>
  )
}

// --- Traffic Tab ---
function TrafficTab() {
  const trainLinks = [
    {
      name: '小田急線',
      sub: '新宿・小田原方面',
      icon: '🔵',
      url: 'https://www.odakyu.jp/cgi-bin/user/emg/emergency_bbs.pl',
    },
    {
      name: 'JR南武線',
      sub: '川崎・立川方面',
      icon: '🟡',
      url: 'https://traininfo.jreast.co.jp/train_info/kanto.aspx',
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-deep-blue">交通情報</h2>

      {trainLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl shadow-sm p-4 border border-snow-gray/50 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{link.icon}</span>
            <div>
              <p className="text-base font-bold text-deep-blue">{link.name}</p>
              <p className="text-xs text-gray-400">{link.sub}</p>
            </div>
            <span className="ml-auto text-gray-300 text-xl">›</span>
          </div>
        </a>
      ))}

      <div className="bg-white rounded-2xl shadow-sm p-4 border border-snow-gray/50">
        <h3 className="text-sm font-bold text-deep-blue mb-2">登戸駅 路線一覧</h3>
        <ul className="text-sm space-y-2 text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            小田急小田原線（各停・急行・快速急行）
          </li>
          <li className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
            JR南武線（各駅停車・快速）
          </li>
        </ul>
      </div>

      <div className="flex items-end gap-3 px-2 mt-4">
        <PenguinIcon className="w-10 h-10 shrink-0" />
        <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm p-3 border border-snow-gray/50 text-xs text-deep-blue">
          運行情報は各公式サイトで確認してね。遅延の時は早めに出発しよう！
        </div>
      </div>
    </div>
  )
}

export default App
