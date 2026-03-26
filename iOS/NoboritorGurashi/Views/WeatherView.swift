import SwiftUI

struct WeatherView: View {
    @StateObject private var service = WeatherService()

    var body: some View {
        ZStack {
            PenguinBackground()
            ScrollView {
                VStack(spacing: 16) {
                    locationHeader
                    if service.isLoading && service.current == nil {
                        loadingView
                    } else if let error = service.error, service.current == nil {
                        errorView(error)
                    } else {
                        if let current = service.current {
                            currentWeatherCard(current)
                        }
                        if !service.forecast.isEmpty {
                            forecastCard
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
        }
        .onAppear { service.startAutoRefresh() }
        .onDisappear { service.stopAutoRefresh() }
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: service.fetch) {
                    Image(systemName: "arrow.clockwise")
                        .foregroundColor(.penguinTealLight)
                }
                .rotationEffect(service.isLoading ? .degrees(360) : .zero)
                .animation(service.isLoading ? .linear(duration: 1).repeatForever() : .default,
                           value: service.isLoading)
            }
        }
    }

    // MARK: - Location Header

    private var locationHeader: some View {
        HStack {
            Label("登戸 · 川崎市多摩区", systemImage: "location.fill")
                .font(.subheadline.bold())
                .foregroundColor(.penguinTealLight)
            Spacer()
            if let updated = service.lastUpdated {
                Text(updated, style: .time)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.35))
            }
        }
        .padding(.top, 8)
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 20) {
            PenguinIllustration(size: 60)
            Text("天気を調べているペン…")
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .penguinCard()
    }

    // MARK: - Error

    private func errorView(_ msg: String) -> some View {
        VStack(spacing: 12) {
            Text("⚠️ \(msg)")
                .foregroundColor(.penguinAccent)
            Button("再試行", action: service.fetch)
                .buttonStyle(PenguinButtonStyle())
        }
        .padding(24)
        .penguinCard(tint: .penguinAccent)
    }

    // MARK: - Current Weather Card

    private func currentWeatherCard(_ w: CurrentWeather) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                Text(w.emoji)
                    .font(.system(size: 72))
                    .shadow(color: .penguinTeal.opacity(0.4), radius: 12)

                VStack(alignment: .leading, spacing: 4) {
                    Text("\(w.temperature)°C")
                        .font(.system(size: 52, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Text(w.description)
                        .font(.title3.bold())
                        .foregroundColor(.penguinTealLight)
                }
                Spacer()
            }

            Divider().background(.white.opacity(0.1))

            HStack(spacing: 0) {
                weatherDetail(icon: "thermometer", label: "体感", value: "\(w.feelsLike)°C")
                Spacer()
                weatherDetail(icon: "humidity", label: "湿度", value: "\(w.humidity)%")
                Spacer()
                weatherDetail(icon: "wind", label: "風速", value: "\(w.windSpeed)km/h")
            }
        }
        .padding(20)
        .penguinCard(tint: .penguinTealDark)
    }

    private func weatherDetail(icon: String, label: String, value: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.penguinTeal)
            Text(value)
                .font(.system(.body, design: .rounded, weight: .bold))
                .foregroundColor(.white)
            Text(label)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.5))
        }
    }

    // MARK: - Forecast Card

    private var forecastCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("7日間の予報")
                .font(.caption.bold())
                .foregroundColor(.white.opacity(0.45))

            HStack(spacing: 4) {
                ForEach(service.forecast) { day in
                    VStack(spacing: 6) {
                        Text(day.dayLabel)
                            .font(.caption2.bold())
                            .foregroundColor(.white.opacity(0.6))
                        Text(day.emoji)
                            .font(.title3)
                        Text("\(day.maxTemp)°")
                            .font(.caption.bold())
                            .foregroundColor(.penguinBeak)
                        Text("\(day.minTemp)°")
                            .font(.caption2)
                            .foregroundColor(.penguinTealLight)
                        HStack(spacing: 1) {
                            Image(systemName: "drop.fill")
                                .font(.system(size: 7))
                            Text("\(day.precipProbability)%")
                                .font(.system(size: 8))
                        }
                        .foregroundColor(.white.opacity(0.4))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(.white.opacity(0.04))
                    .cornerRadius(10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .strokeBorder(.white.opacity(0.06), lineWidth: 1)
                    )
                }
            }
        }
        .padding(16)
        .penguinCard()
    }
}

#Preview {
    WeatherView()
}
