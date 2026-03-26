import Foundation

enum ShoppingCategory: String, Codable, CaseIterable {
    case food    = "food"
    case drink   = "drink"
    case daily   = "daily"
    case other   = "other"

    var label: String {
        switch self {
        case .food:  return "食品"
        case .drink: return "飲み物"
        case .daily: return "日用品"
        case .other: return "その他"
        }
    }

    var icon: String {
        switch self {
        case .food:  return "🍱"
        case .drink: return "🧃"
        case .daily: return "🧴"
        case .other: return "📦"
        }
    }
}

struct ShoppingItem: Identifiable, Codable, Equatable {
    var id: String
    var text: String
    var category: ShoppingCategory
    var isDone: Bool
    var createdAt: Date

    init(id: String = UUID().uuidString, text: String, category: ShoppingCategory = .food, isDone: Bool = false) {
        self.id = id
        self.text = text
        self.category = category
        self.isDone = isDone
        self.createdAt = Date()
    }

    // Firestore serialization
    var firestoreData: [String: Any] {
        [
            "id": id,
            "text": text,
            "category": category.rawValue,
            "isDone": isDone,
            "createdAt": createdAt.timeIntervalSince1970,
        ]
    }

    init?(from data: [String: Any]) {
        guard
            let id = data["id"] as? String,
            let text = data["text"] as? String
        else { return nil }
        self.id = id
        self.text = text
        self.category = ShoppingCategory(rawValue: data["category"] as? String ?? "food") ?? .food
        self.isDone = data["isDone"] as? Bool ?? false
        let ts = data["createdAt"] as? Double ?? 0
        self.createdAt = ts > 0 ? Date(timeIntervalSince1970: ts) : Date()
    }
}
