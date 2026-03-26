import Foundation
import SwiftUI

enum MemoColor: String, Codable, CaseIterable {
    case teal   = "teal"
    case yellow = "yellow"
    case green  = "green"
    case pink   = "pink"
    case purple = "purple"

    var color: Color {
        switch self {
        case .teal:   return Color(hex: "00B4D8")
        case .yellow: return Color(hex: "F7A800")
        case .green:  return Color(hex: "4ECD64")
        case .pink:   return Color(hex: "FF6B6B")
        case .purple: return Color(hex: "9D4EDD")
        }
    }

    var label: String { rawValue }
}

struct MemoItem: Identifiable, Codable, Equatable {
    var id: String
    var title: String
    var body: String
    var color: MemoColor
    var createdAt: Date
    var updatedAt: Date

    init(id: String = UUID().uuidString, title: String, body: String = "", color: MemoColor = .teal) {
        self.id = id
        self.title = title
        self.body = body
        self.color = color
        self.createdAt = Date()
        self.updatedAt = Date()
    }

    var firestoreData: [String: Any] {
        [
            "id": id,
            "title": title,
            "body": body,
            "color": color.rawValue,
            "createdAt": createdAt.timeIntervalSince1970,
            "updatedAt": updatedAt.timeIntervalSince1970,
        ]
    }

    init?(from data: [String: Any]) {
        guard
            let id = data["id"] as? String,
            let title = data["title"] as? String
        else { return nil }
        self.id = id
        self.title = title
        self.body = data["body"] as? String ?? ""
        self.color = MemoColor(rawValue: data["color"] as? String ?? "teal") ?? .teal
        let created = data["createdAt"] as? Double ?? 0
        let updated = data["updatedAt"] as? Double ?? 0
        self.createdAt = created > 0 ? Date(timeIntervalSince1970: created) : Date()
        self.updatedAt = updated > 0 ? Date(timeIntervalSince1970: updated) : Date()
    }
}
