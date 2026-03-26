import Foundation
import SwiftUI

// ============================================================
// 川崎市多摩区 登戸地区 ごみ収集スケジュール
// 出典: 川崎市「収集日一覧（多摩区・麻生区）」
// https://www.city.kawasaki.jp/300/page/0000012577.html
// ============================================================

struct GarbageType: Identifiable {
    let id: String
    let label: String
    let icon: String
    let color: Color
}

let allGarbageTypes: [GarbageType] = [
    GarbageType(id: "burnable",         label: "燃えるごみ",   icon: "🔥", color: Color(hex: "FF6B6B")),
    GarbageType(id: "noncombustible",   label: "燃えないごみ", icon: "🧱", color: Color(hex: "B8C0CC")),
    GarbageType(id: "plastic",          label: "プラ容器包装", icon: "♻️", color: Color(hex: "4ECDC4")),
    GarbageType(id: "resource_can",     label: "缶・ビン・PET", icon: "🥤", color: Color(hex: "F7A800")),
    GarbageType(id: "paper",            label: "古紙・古布",   icon: "📰", color: Color(hex: "90E0EF")),
    GarbageType(id: "metal",            label: "小物金属",     icon: "🔧", color: Color(hex: "9E9E9E")),
]

struct ScheduleEntry {
    let type: GarbageType
    /// nil = 毎週, weekFilter = 特定の週のみ
    let weekFilter: ((Int) -> Bool)?
}

// 曜日ごとのスケジュール (0=日, 1=月, 2=火, 3=水, 4=木, 5=金, 6=土)
let weeklySchedule: [Int: [ScheduleEntry]] = {
    let types = Dictionary(uniqueKeysWithValues: allGarbageTypes.map { ($0.id, $0) })
    return [
        1: [ // 月曜
            ScheduleEntry(type: types["burnable"]!,        weekFilter: nil),
            ScheduleEntry(type: types["noncombustible"]!,  weekFilter: { $0 == 4 }),    // 第4月曜
            ScheduleEntry(type: types["metal"]!,           weekFilter: { $0 == 2 }),    // 第2月曜
        ],
        2: [ // 火曜
            ScheduleEntry(type: types["plastic"]!, weekFilter: nil),
        ],
        3: [ // 水曜
            ScheduleEntry(type: types["resource_can"]!, weekFilter: { $0 == 2 || $0 == 4 }), // 第2・4水曜
            ScheduleEntry(type: types["paper"]!,        weekFilter: { $0 == 1 || $0 == 3 }), // 第1・3水曜
        ],
        4: [ // 木曜
            ScheduleEntry(type: types["burnable"]!, weekFilter: nil),
        ],
        5: [],
        6: [],
        0: [],
    ]
}()

/// 指定日のごみ収集種別を返す
func garbageForDate(_ date: Date) -> [GarbageType] {
    let calendar = Calendar.current
    let weekday = calendar.component(.weekday, from: date) - 1  // 0=日
    let weekOfMonth = Int(ceil(Double(calendar.component(.day, from: date)) / 7.0))

    guard let entries = weeklySchedule[weekday] else { return [] }
    return entries.compactMap { entry in
        guard entry.weekFilter == nil || entry.weekFilter!(weekOfMonth) else { return nil }
        return entry.type
    }
}

/// 今日から count 日以内のごみ出し予定を返す (ごみがある日のみ)
func upcomingGarbageDays(from startDate: Date, count: Int = 7) -> [(date: Date, types: [GarbageType])] {
    var result: [(date: Date, types: [GarbageType])] = []
    for offset in 0...14 {
        guard result.count < count else { break }
        let date = Calendar.current.date(byAdding: .day, value: offset, to: startDate)!
        let types = garbageForDate(date)
        if !types.isEmpty {
            result.append((date, types))
        }
    }
    return result
}
