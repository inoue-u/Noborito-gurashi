import Foundation

struct CurrentWeather {
    let temperature: Int
    let feelsLike: Int
    let humidity: Int
    let windSpeed: Int
    let description: String
    let emoji: String
}

struct DailyForecast: Identifiable {
    let id = UUID()
    let date: Date
    let maxTemp: Int
    let minTemp: Int
    let precipProbability: Int
    let description: String
    let emoji: String

    var dayLabel: String {
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "今日" }
        if cal.isDateInTomorrow(date) { return "明日" }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.dateFormat = "E"
        return formatter.string(from: date)
    }
}

// WMO weather code → Japanese description + emoji
func wmoDescription(code: Int) -> (String, String) {
    switch code {
    case 0:        return ("快晴", "☀️")
    case 1:        return ("晴れ", "🌤️")
    case 2:        return ("一部曇り", "⛅")
    case 3:        return ("曇り", "☁️")
    case 45, 48:   return ("霧", "🌫️")
    case 51, 53:   return ("霧雨", "🌦️")
    case 55:       return ("強い霧雨", "🌧️")
    case 61:       return ("小雨", "🌧️")
    case 63:       return ("雨", "🌧️")
    case 65:       return ("大雨", "🌧️")
    case 71:       return ("小雪", "🌨️")
    case 73:       return ("雪", "❄️")
    case 75:       return ("大雪", "❄️")
    case 80, 81:   return ("にわか雨", "🌦️")
    case 82:       return ("強いにわか雨", "⛈️")
    case 95, 96, 99: return ("雷雨", "⛈️")
    default:       return ("--", "🌡️")
    }
}

// Open-Meteo API response
struct OpenMeteoResponse: Decodable {
    struct Current: Decodable {
        let temperature2m: Double
        let apparentTemperature: Double
        let relativehumidity2m: Int
        let windspeed10m: Double
        let weathercode: Int

        enum CodingKeys: String, CodingKey {
            case temperature2m = "temperature_2m"
            case apparentTemperature = "apparent_temperature"
            case relativehumidity2m = "relativehumidity_2m"
            case windspeed10m = "windspeed_10m"
            case weathercode
        }
    }

    struct Daily: Decodable {
        let time: [String]
        let weathercode: [Int]
        let temperature2mMax: [Double]
        let temperature2mMin: [Double]
        let precipitationProbabilityMax: [Int]

        enum CodingKeys: String, CodingKey {
            case time
            case weathercode
            case temperature2mMax = "temperature_2m_max"
            case temperature2mMin = "temperature_2m_min"
            case precipitationProbabilityMax = "precipitation_probability_max"
        }
    }

    let current: Current
    let daily: Daily
}
