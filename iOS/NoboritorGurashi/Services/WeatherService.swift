import Foundation

// 登戸 (川崎市多摩区) 座標
private let latitude  = 35.622
private let longitude = 139.566

@MainActor
class WeatherService: ObservableObject {
    @Published var current: CurrentWeather?
    @Published var forecast: [DailyForecast] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var lastUpdated: Date?

    private var refreshTask: Task<Void, Never>?

    func startAutoRefresh() {
        fetch()
        refreshTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 30 * 60 * 1_000_000_000) // 30分
                if !Task.isCancelled { fetch() }
            }
        }
    }

    func stopAutoRefresh() {
        refreshTask?.cancel()
    }

    func fetch() {
        Task {
            await loadWeather()
        }
    }

    private func loadWeather() async {
        isLoading = true
        error = nil

        let urlStr = "https://api.open-meteo.com/v1/forecast" +
            "?latitude=\(latitude)&longitude=\(longitude)" +
            "&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m" +
            "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
            "&timezone=Asia%2FTokyo&forecast_days=7"

        guard let url = URL(string: urlStr) else {
            error = "URLエラー"
            isLoading = false
            return
        }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(OpenMeteoResponse.self, from: data)

            let (desc, emoji) = wmoDescription(code: decoded.current.weathercode)
            current = CurrentWeather(
                temperature: Int(decoded.current.temperature2m.rounded()),
                feelsLike: Int(decoded.current.apparentTemperature.rounded()),
                humidity: decoded.current.relativehumidity2m,
                windSpeed: Int(decoded.current.windspeed10m.rounded()),
                description: desc,
                emoji: emoji
            )

            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            forecast = zip(decoded.daily.time.indices, decoded.daily.time).compactMap { i, dateStr in
                guard let date = formatter.date(from: dateStr) else { return nil }
                let (d, e) = wmoDescription(code: decoded.daily.weathercode[i])
                return DailyForecast(
                    date: date,
                    maxTemp: Int(decoded.daily.temperature2mMax[i].rounded()),
                    minTemp: Int(decoded.daily.temperature2mMin[i].rounded()),
                    precipProbability: decoded.daily.precipitationProbabilityMax[i],
                    description: d,
                    emoji: e
                )
            }

            lastUpdated = Date()
        } catch {
            self.error = "天気データの取得に失敗しました"
        }

        isLoading = false
    }
}
