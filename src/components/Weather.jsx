import { useState, useEffect } from 'react'
import styles from './Weather.module.css'

// 登戸 (川崎市多摩区) 座標
const LAT = 35.622
const LON = 139.566

const WMO_CODES = {
  0: { label: '快晴', icon: '☀️' },
  1: { label: '晴れ', icon: '🌤️' },
  2: { label: '一部曇り', icon: '⛅' },
  3: { label: '曇り', icon: '☁️' },
  45: { label: '霧', icon: '🌫️' },
  48: { label: '霧氷', icon: '🌫️' },
  51: { label: '霧雨（弱）', icon: '🌦️' },
  53: { label: '霧雨', icon: '🌦️' },
  55: { label: '霧雨（強）', icon: '🌧️' },
  61: { label: '雨（弱）', icon: '🌧️' },
  63: { label: '雨', icon: '🌧️' },
  65: { label: '大雨', icon: '🌧️' },
  71: { label: '雪（弱）', icon: '🌨️' },
  73: { label: '雪', icon: '❄️' },
  75: { label: '大雪', icon: '❄️' },
  80: { label: 'にわか雨（弱）', icon: '🌦️' },
  81: { label: 'にわか雨', icon: '🌧️' },
  82: { label: 'にわか雨（強）', icon: '⛈️' },
  95: { label: '雷雨', icon: '⛈️' },
  96: { label: '雷雨・ひょう', icon: '⛈️' },
  99: { label: '激しい雷雨', icon: '⛈️' },
}

const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

function getWeatherInfo(code) {
  return WMO_CODES[code] ?? { label: '不明', icon: '🌡️' }
}

export default function Weather() {
  const [current, setCurrent] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function fetchWeather() {
    setLoading(true)
    setError(null)
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
        `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FTokyo&forecast_days=7`
      const res = await fetch(url)
      if (!res.ok) throw new Error('天気データの取得に失敗しました')
      const data = await res.json()

      setCurrent({
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relativehumidity_2m,
        wind: Math.round(data.current.windspeed_10m),
        weather: getWeatherInfo(data.current.weathercode),
      })

      const dailyForecast = data.daily.time.map((dateStr, i) => {
        const d = new Date(dateStr)
        return {
          date: dateStr,
          dayLabel: i === 0 ? '今日' : i === 1 ? '明日' : `${DAYS_JA[d.getDay()]}曜`,
          weather: getWeatherInfo(data.daily.weathercode[i]),
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          precip: data.daily.precipitation_probability_max[i],
        }
      })
      setForecast(dailyForecast)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
    const timer = setInterval(fetchWeather, 30 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const now = new Date()
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${DAYS_JA[now.getDay()]}）`

  return (
    <div className={`card ${styles.weatherCard}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.location}>📍 登戸 · 川崎市多摩区</div>
          <div className={styles.dateStr}>{dateStr}</div>
        </div>
        <button className={styles.refreshBtn} onClick={fetchWeather} title="更新">
          🔄
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>
          <div className={styles.penguin}>🐧</div>
          <p>天気を調べているよ…</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button className="btn-primary" onClick={fetchWeather} style={{ marginTop: 8, fontSize: '0.8rem' }}>
            再試行
          </button>
        </div>
      )}

      {!loading && !error && current && (
        <>
          <div className={styles.currentWeather}>
            <div className={styles.weatherIcon}>{current.weather.icon}</div>
            <div className={styles.tempBlock}>
              <div className={styles.temp}>{current.temp}°C</div>
              <div className={styles.weatherLabel}>{current.weather.label}</div>
            </div>
            <div className={styles.details}>
              <div className={styles.detailItem}>
                <span>🌡️</span> 体感 {current.feelsLike}°C
              </div>
              <div className={styles.detailItem}>
                <span>💧</span> 湿度 {current.humidity}%
              </div>
              <div className={styles.detailItem}>
                <span>💨</span> 風速 {current.wind} km/h
              </div>
            </div>
          </div>

          <div className={styles.forecastTitle}>7日間の予報</div>
          <div className={styles.forecast}>
            {forecast.map((day) => (
              <div key={day.date} className={styles.forecastDay}>
                <div className={styles.forecastLabel}>{day.dayLabel}</div>
                <div className={styles.forecastIcon}>{day.weather.icon}</div>
                <div className={styles.forecastTemp}>
                  <span className={styles.maxTemp}>{day.max}°</span>
                  <span className={styles.minTemp}>{day.min}°</span>
                </div>
                <div className={styles.precipChance}>
                  💧{day.precip}%
                </div>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <div className={styles.lastUpdated}>
              更新: {lastUpdated.getHours()}:{String(lastUpdated.getMinutes()).padStart(2, '0')}
            </div>
          )}
        </>
      )}
    </div>
  )
}
