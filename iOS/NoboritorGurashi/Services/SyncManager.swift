import Foundation
import Combine

// ============================================================
// SyncManager: Firebase Firestore を使ったリアルタイム同期
// Firebase SDK未設定の場合は UserDefaults でローカル動作
//
// Firebase セットアップ手順:
// 1. Xcode > File > Add Package Dependencies
//    URL: https://github.com/firebase/firebase-ios-sdk
//    Products: FirebaseFirestore, FirebaseCore を選択
// 2. Firebase Console でプロジェクト作成
// 3. iOS アプリを追加 (Bundle ID: com.noborito.gurashi)
// 4. GoogleService-Info.plist をダウンロードしてプロジェクトに追加
// ============================================================

@MainActor
class SyncManager: ObservableObject {
    @Published var shoppingItems: [ShoppingItem] = []
    @Published var memos: [MemoItem] = []
    @Published var isSyncing = false

    private let householdId: String
    private var firebaseEnabled = false

    // UserDefaultsキー
    private var shoppingKey: String { "noborito.\(householdId).shopping" }
    private var memoKey: String     { "noborito.\(householdId).memos" }

    init(householdId: String) {
        self.householdId = householdId
        checkFirebaseAvailability()
        loadFromLocal()
        startListening()
    }

    private func checkFirebaseAvailability() {
        #if canImport(FirebaseFirestore)
        firebaseEnabled = true
        #else
        firebaseEnabled = false
        #endif
    }

    // MARK: - Local Storage (fallback)

    private func loadFromLocal() {
        if let data = UserDefaults.standard.data(forKey: shoppingKey),
           let items = try? JSONDecoder().decode([ShoppingItem].self, from: data) {
            shoppingItems = items
        }
        if let data = UserDefaults.standard.data(forKey: memoKey),
           let items = try? JSONDecoder().decode([MemoItem].self, from: data) {
            memos = items
        }
    }

    private func saveShoppingLocal() {
        if let data = try? JSONEncoder().encode(shoppingItems) {
            UserDefaults.standard.set(data, forKey: shoppingKey)
        }
    }

    private func saveMemoLocal() {
        if let data = try? JSONEncoder().encode(memos) {
            UserDefaults.standard.set(data, forKey: memoKey)
        }
    }

    // MARK: - Listening (Firebase or local)

    func startListening() {
        #if canImport(FirebaseFirestore)
        startFirebaseListeners()
        #endif
        // Without Firebase: loaded from UserDefaults in init
    }

    // MARK: - Shopping List Operations

    func addShoppingItem(text: String, category: ShoppingCategory) {
        let item = ShoppingItem(text: text, category: category)
        #if canImport(FirebaseFirestore)
        if firebaseEnabled { addFirestore(item, collection: "shopping"); return }
        #endif
        shoppingItems.insert(item, at: 0)
        saveShoppingLocal()
    }

    func toggleShoppingItem(_ item: ShoppingItem) {
        var updated = item
        updated.isDone = !updated.isDone
        #if canImport(FirebaseFirestore)
        if firebaseEnabled { updateFirestore(updated, collection: "shopping"); return }
        #endif
        if let idx = shoppingItems.firstIndex(where: { $0.id == item.id }) {
            shoppingItems[idx] = updated
        }
        saveShoppingLocal()
    }

    func deleteShoppingItem(_ item: ShoppingItem) {
        #if canImport(FirebaseFirestore)
        if firebaseEnabled { deleteFirestore(id: item.id, collection: "shopping"); return }
        #endif
        shoppingItems.removeAll { $0.id == item.id }
        saveShoppingLocal()
    }

    func clearDoneItems() {
        let done = shoppingItems.filter(\.isDone)
        #if canImport(FirebaseFirestore)
        if firebaseEnabled { done.forEach { deleteFirestore(id: $0.id, collection: "shopping") }; return }
        #endif
        shoppingItems.removeAll(where: \.isDone)
        saveShoppingLocal()
    }

    // MARK: - Memo Operations

    func saveMemo(_ memo: MemoItem) {
        var updated = memo
        updated.updatedAt = Date()
        let isNew = !memos.contains(where: { $0.id == memo.id })
        #if canImport(FirebaseFirestore)
        if firebaseEnabled {
            isNew ? addFirestore(updated, collection: "memos") : updateFirestore(updated, collection: "memos")
            return
        }
        #endif
        if isNew {
            memos.insert(updated, at: 0)
        } else if let idx = memos.firstIndex(where: { $0.id == memo.id }) {
            memos[idx] = updated
        }
        saveMemoLocal()
    }

    func deleteMemo(_ memo: MemoItem) {
        #if canImport(FirebaseFirestore)
        if firebaseEnabled { deleteFirestore(id: memo.id, collection: "memos"); return }
        #endif
        memos.removeAll { $0.id == memo.id }
        saveMemoLocal()
    }
}

// MARK: - Firebase Implementation (conditional)

#if canImport(FirebaseFirestore)
import FirebaseFirestore

private var shoppingListener: ListenerRegistration?
private var memoListener: ListenerRegistration?

extension SyncManager {
    func startFirebaseListeners() {
        guard firebaseEnabled else { return }
        let db = Firestore.firestore()
        isSyncing = true

        shoppingListener = db
            .collection("households").document(householdId).collection("shopping")
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                self.isSyncing = false
                guard let docs = snapshot?.documents else { return }
                let items = docs.compactMap { ShoppingItem(from: $0.data()) }
                self.shoppingItems = items
                self.saveShoppingLocal() // キャッシュ更新
            }

        memoListener = db
            .collection("households").document(householdId).collection("memos")
            .order(by: "updatedAt", descending: true)
            .addSnapshotListener { [weak self] snapshot, error in
                guard let self else { return }
                guard let docs = snapshot?.documents else { return }
                let items = docs.compactMap { MemoItem(from: $0.data()) }
                self.memos = items
                self.saveMemoLocal()
            }
    }

    func stopFirebaseListeners() {
        shoppingListener?.remove()
        memoListener?.remove()
    }

    func addFirestore<T: Codable>(_ item: T, collection: String) where T: HasFirestoreData {
        let db = Firestore.firestore()
        db.collection("households").document(householdId).collection(collection)
            .document(item.id)
            .setData(item.firestoreData)
    }

    func updateFirestore<T: Codable>(_ item: T, collection: String) where T: HasFirestoreData {
        let db = Firestore.firestore()
        db.collection("households").document(householdId).collection(collection)
            .document(item.id)
            .setData(item.firestoreData, merge: true)
    }

    func deleteFirestore(id: String, collection: String) {
        let db = Firestore.firestore()
        db.collection("households").document(householdId).collection(collection)
            .document(id)
            .delete()
    }
}

// Protocol to access firestoreData and id
protocol HasFirestoreData {
    var id: String { get }
    var firestoreData: [String: Any] { get }
}

extension ShoppingItem: HasFirestoreData {}
extension MemoItem: HasFirestoreData {}

#endif
