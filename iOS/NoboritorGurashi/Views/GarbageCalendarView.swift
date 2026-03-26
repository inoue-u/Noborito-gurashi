import SwiftUI

struct GarbageCalendarView: View {
    @State private var displayMonth = Date()
    private let calendar = Calendar.current
    private let today = Date()

    var body: some View {
        ZStack {
            PenguinBackground()
            ScrollView {
                VStack(spacing: 16) {
                    todaySection
                    upcomingSection
                    calendarSection
                    legendSection
                    officialLinksSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
        }
    }

    // MARK: - Today

    private var todaySection: some View {
        let types = garbageForDate(today)
        return VStack(alignment: .leading, spacing: 10) {
            Label("今日のごみ出し", systemImage: "calendar.circle.fill")
                .font(.caption.bold())
                .foregroundColor(.penguinTealLight)

            if types.isEmpty {
                HStack(spacing: 8) {
                    Text("🐧")
                    Text("今日はごみの日じゃないペン")
                        .foregroundColor(.white.opacity(0.5))
                }
            } else {
                FlowLayout(spacing: 8) {
                    ForEach(types) { type in
                        GarbageTagView(icon: type.icon, label: type.label, color: type.color)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .penguinCard(tint: .penguinTealDark)
    }

    // MARK: - Upcoming

    private var upcomingSection: some View {
        let upcoming = upcomingGarbageDays(from: today, count: 5)
        return VStack(alignment: .leading, spacing: 8) {
            Text("直近のごみ出し予定")
                .font(.caption.bold())
                .foregroundColor(.white.opacity(0.45))

            ForEach(upcoming, id: \.date) { item in
                upcomingRow(item.date, types: item.types)
            }
        }
        .padding(16)
        .penguinCard()
    }

    private func upcomingRow(_ date: Date, types: [GarbageType]) -> some View {
        let isT = calendar.isDateInToday(date)
        let diff = calendar.dateComponents([.day], from: today, to: date).day ?? 0
        let diffLabel = diff == 0 ? "今日" : diff == 1 ? "明日" : "\(diff)日後"
        let dowLabel = date.formatted(.dateTime.weekday(.abbreviated).locale(Locale(identifier: "ja")))

        return HStack(spacing: 8) {
            VStack(alignment: .center, spacing: 2) {
                Text("\(calendar.component(.month, from: date))/\(calendar.component(.day, from: date))")
                    .font(.system(.subheadline, design: .rounded, weight: .bold))
                    .foregroundColor(.white)
                Text(dowLabel)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.5))
                Text(diffLabel)
                    .font(.caption2.bold())
                    .foregroundColor(.penguinTealLight)
            }
            .frame(width: 52)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(types) { t in
                        GarbageTagView(icon: t.icon, label: t.label, color: t.color)
                    }
                }
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(isT ? Color.penguinTeal.opacity(0.1) : Color.white.opacity(0.03))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(isT ? Color.penguinTeal.opacity(0.3) : Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - Calendar

    private var calendarSection: some View {
        VStack(spacing: 10) {
            // Nav header
            HStack {
                Button(action: prevMonth) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.penguinTealLight)
                        .padding(8)
                }
                Spacer()
                Text(displayMonth.formatted(.dateTime.year().month(.wide).locale(Locale(identifier: "ja"))))
                    .font(.system(.body, design: .rounded, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
                Button(action: nextMonth) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.penguinTealLight)
                        .padding(8)
                }
            }

            // Weekday headers
            HStack {
                ForEach(["日","月","火","水","木","金","土"], id: \.self) { d in
                    Text(d)
                        .font(.caption2.bold())
                        .foregroundColor(d == "日" ? .red.opacity(0.7) : d == "土" ? .blue.opacity(0.7) : .white.opacity(0.4))
                        .frame(maxWidth: .infinity)
                }
            }

            // Calendar grid
            let days = calendarDays(for: displayMonth)
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 4) {
                ForEach(days.indices, id: \.self) { i in
                    if let day = days[i] {
                        calendarCell(day)
                    } else {
                        Color.clear.frame(height: 44)
                    }
                }
            }
        }
        .padding(14)
        .penguinCard()
    }

    private func calendarCell(_ date: Date) -> some View {
        let dayNumber = calendar.component(.day, from: date)
        let isT = calendar.isDateInToday(date)
        let types = garbageForDate(date)
        let weekday = calendar.component(.weekday, from: date)

        return VStack(spacing: 2) {
            Text("\(dayNumber)")
                .font(.caption.bold())
                .foregroundColor(
                    isT ? .penguinTeal :
                    weekday == 1 ? .red.opacity(0.7) :
                    weekday == 7 ? .blue.opacity(0.7) :
                    .white.opacity(0.75)
                )
            // Dots for garbage types
            HStack(spacing: 2) {
                ForEach(types.prefix(3)) { t in
                    Circle()
                        .fill(t.color)
                        .frame(width: 5, height: 5)
                }
            }
        }
        .frame(height: 40)
        .frame(maxWidth: .infinity)
        .background(isT ? Color.penguinTeal.opacity(0.15) : Color.white.opacity(0.02))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(isT ? Color.penguinTeal.opacity(0.4) : Color.clear, lineWidth: 1.5)
        )
    }

    private func calendarDays(for date: Date) -> [Date?] {
        guard let range = calendar.range(of: .day, in: .month, for: date),
              let firstDay = calendar.date(from: calendar.dateComponents([.year, .month], from: date))
        else { return [] }

        let startWeekday = calendar.component(.weekday, from: firstDay) - 1
        var days: [Date?] = Array(repeating: nil, count: startWeekday)
        for d in range {
            let day = calendar.date(byAdding: .day, value: d - 1, to: firstDay)!
            days.append(day)
        }
        return days
    }

    private func prevMonth() {
        displayMonth = calendar.date(byAdding: .month, value: -1, to: displayMonth) ?? displayMonth
    }
    private func nextMonth() {
        displayMonth = calendar.date(byAdding: .month, value: 1, to: displayMonth) ?? displayMonth
    }

    // MARK: - Legend

    private var legendSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
            ForEach(allGarbageTypes) { type in
                HStack(spacing: 6) {
                    Circle().fill(type.color).frame(width: 8, height: 8)
                    Text(type.icon)
                    Text(type.label)
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.65))
                    Spacer()
                }
            }
        }
        .padding(12)
        .penguinCard()
    }

    // MARK: - Official Links

    private var officialLinksSection: some View {
        VStack(spacing: 8) {
            Link(destination: URL(string: "https://www.city.kawasaki.jp/300/page/0000012577.html")!) {
                Label("川崎市公式 収集日一覧を確認", systemImage: "globe")
                    .font(.subheadline.bold())
                    .foregroundColor(.penguinTealLight)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color.penguinTeal.opacity(0.08))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.penguinTeal.opacity(0.2), lineWidth: 1))
            }
            Link(destination: URL(string: "https://apps.apple.com/jp/app/%E5%B7%9D%E5%B4%8E%E5%B8%82%E3%81%94%E3%81%BF%E5%88%86%E5%88%A5%E3%82%A2%E3%83%97%E3%83%AA/id1074173358")!) {
                Label("川崎市ごみ分別アプリ (App Store)", systemImage: "app.badge")
                    .font(.subheadline.bold())
                    .foregroundColor(.penguinTealLight)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color.penguinTeal.opacity(0.08))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.penguinTeal.opacity(0.2), lineWidth: 1))
            }
        }
    }
}

// MARK: - FlowLayout (タグの折り返しレイアウト)

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        let height = rows.map(\.height).reduce(0, +) + CGFloat(max(rows.count - 1, 0)) * spacing
        return CGSize(width: proposal.width ?? 0, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        var y = bounds.minY
        for row in rows {
            var x = bounds.minX
            for view in row.views {
                let size = view.sizeThatFits(.unspecified)
                view.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
                x += size.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct Row { var views: [LayoutSubview] = []; var height: CGFloat = 0 }

    private func computeRows(proposal: ProposedViewSize, subviews: Subviews) -> [Row] {
        let maxWidth = proposal.width ?? .infinity
        var rows: [Row] = [Row()]
        var currentX: CGFloat = 0

        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if currentX + size.width > maxWidth && !rows[rows.count - 1].views.isEmpty {
                rows.append(Row())
                currentX = 0
            }
            rows[rows.count - 1].views.append(view)
            rows[rows.count - 1].height = max(rows[rows.count - 1].height, size.height)
            currentX += size.width + spacing
        }
        return rows
    }
}

#Preview {
    GarbageCalendarView()
}
