import SwiftUI

// MARK: - Penguin Color Palette

extension Color {
    static let penguinBlack      = Color(hex: "1A1A2E")
    static let penguinDark       = Color(hex: "16213E")
    static let penguinNavy       = Color(hex: "0F3460")
    static let penguinTeal       = Color(hex: "00B4D8")
    static let penguinTealLight  = Color(hex: "90E0EF")
    static let penguinTealDark   = Color(hex: "0077B6")
    static let penguinBeak       = Color(hex: "F7A800")
    static let penguinAccent     = Color(hex: "FF6B6B")
    static let penguinBelly      = Color(hex: "F0F4F8")

    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted))
        var rgb: UInt64 = 0
        scanner.scanHexInt64(&rgb)
        let r = Double((rgb & 0xFF0000) >> 16) / 255
        let g = Double((rgb & 0x00FF00) >> 8) / 255
        let b = Double(rgb & 0x0000FF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Background

struct PenguinBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.penguinBlack, .penguinDark, .penguinNavy],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            // 雪の粒
            GeometryReader { geo in
                ForEach(0..<40, id: \.self) { i in
                    Circle()
                        .fill(Color.white.opacity(Double.random(in: 0.03...0.08)))
                        .frame(width: CGFloat.random(in: 2...5))
                        .position(
                            x: CGFloat.random(in: 0...geo.size.width),
                            y: CGFloat.random(in: 0...geo.size.height)
                        )
                }
            }
        }
        .ignoresSafeArea()
    }
}

// MARK: - Card Style

struct PenguinCard: ViewModifier {
    var tint: Color = .clear

    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(.ultraThinMaterial)
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(tint.opacity(0.08))
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(tint.opacity(0.25), lineWidth: 1)
                }
            )
    }
}

extension View {
    func penguinCard(tint: Color = .penguinTeal) -> some View {
        modifier(PenguinCard(tint: tint))
    }
}

// MARK: - Penguin Button Style

struct PenguinButtonStyle: ButtonStyle {
    var color: Color = .penguinTeal

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [color, color.opacity(0.7)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .foregroundColor(.white)
            .font(.system(.body, design: .rounded, weight: .bold))
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(.spring(response: 0.2), value: configuration.isPressed)
    }
}

// MARK: - Tag style

struct GarbageTagView: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack(spacing: 5) {
            Text(icon)
                .font(.caption)
            Text(label)
                .font(.caption)
                .fontWeight(.bold)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color.opacity(0.18))
        .overlay(
            Capsule().strokeBorder(color.opacity(0.45), lineWidth: 1)
        )
        .clipShape(Capsule())
        .foregroundColor(color)
    }
}

// MARK: - Sync Status Badge

struct SyncStatusBadge: View {
    let householdId: String
    let isSyncing: Bool
    let onCopy: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: isSyncing ? "arrow.triangle.2.circlepath" : "checkmark.icloud")
                .font(.caption2)
                .foregroundColor(.penguinTeal)
                .rotationEffect(.degrees(isSyncing ? 360 : 0))
                .animation(isSyncing ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: isSyncing)

            Text("共有コード")
                .font(.caption2)
                .foregroundColor(.penguinTealLight.opacity(0.7))

            Button(action: onCopy) {
                Text(householdId)
                    .font(.caption.monospaced())
                    .fontWeight(.black)
                    .foregroundColor(.penguinTealLight)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(.white.opacity(0.06))
                    .cornerRadius(6)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .strokeBorder(.white.opacity(0.12), lineWidth: 1)
                    )
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(.teal.opacity(0.06))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(.teal.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Penguin Illustration

struct PenguinIllustration: View {
    var size: CGFloat = 80
    @State private var isAnimating = false

    var body: some View {
        Text("🐧")
            .font(.system(size: size))
            .rotationEffect(.degrees(isAnimating ? -10 : 10))
            .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: isAnimating)
            .onAppear { isAnimating = true }
    }
}
