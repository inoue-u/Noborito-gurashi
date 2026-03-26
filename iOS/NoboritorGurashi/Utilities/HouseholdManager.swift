import SwiftUI
import Combine

@MainActor
class HouseholdManager: ObservableObject {
    @Published var householdId: String?
    @AppStorage("noborito.householdId") private var storedId: String = ""

    init() {
        if !storedId.isEmpty {
            householdId = storedId
        }
    }

    /// 新しい世帯を作成し6文字コードを発行
    func createHousehold() {
        let id = Self.generateCode()
        storedId = id
        householdId = id
    }

    /// コードを入力して既存の世帯に参加
    @discardableResult
    func joinHousehold(code: String) -> Bool {
        let cleaned = code.uppercased().trimmingCharacters(in: .whitespaces)
        guard cleaned.count >= 4 else { return false }
        storedId = cleaned
        householdId = cleaned
        return true
    }

    func leaveHousehold() {
        storedId = ""
        householdId = nil
    }

    private static func generateCode() -> String {
        let chars = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
        return String((0..<6).map { _ in chars.randomElement()! })
    }
}
