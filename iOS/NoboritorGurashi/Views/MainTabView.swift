import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var household: HouseholdManager
    @StateObject private var syncManager: SyncManager
    @State private var selectedTab = 0

    init() {
        // SyncManager is initialized after household is known;
        // actual init is done in .task below via @StateObject
        _syncManager = StateObject(wrappedValue: SyncManager(householdId: "placeholder"))
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                NavigationStack {
                    WeatherView()
                        .navigationTitle("天気")
                        .navigationBarTitleDisplayMode(.inline)
                }
                .tag(0)
                .tabItem { Label("天気", systemImage: "sun.max.fill") }

                NavigationStack {
                    GarbageCalendarView()
                        .navigationTitle("ごみ出し")
                        .navigationBarTitleDisplayMode(.inline)
                }
                .tag(1)
                .tabItem { Label("ごみ", systemImage: "calendar.badge.checkmark") }

                NavigationStack {
                    ShoppingListView(syncManager: syncManager)
                        .navigationTitle("買い物リスト")
                        .navigationBarTitleDisplayMode(.inline)
                }
                .tag(2)
                .tabItem { Label("買い物", systemImage: "cart.fill") }

                NavigationStack {
                    MemoView(syncManager: syncManager)
                        .navigationTitle("メモ")
                        .navigationBarTitleDisplayMode(.inline)
                }
                .tag(3)
                .tabItem { Label("メモ", systemImage: "note.text") }
            }
            .accentColor(.penguinTeal)
        }
        .task {
            // Re-create with actual householdId
            if let id = household.householdId, syncManager.householdId == "placeholder" {
                // Note: In production, inject SyncManager via @EnvironmentObject
            }
        }
    }
}

// Better version using EnvironmentObject for SyncManager

struct MainTabViewV2: View {
    @EnvironmentObject var household: HouseholdManager
    @State private var selectedTab = 0

    var body: some View {
        Group {
            if let id = household.householdId {
                SyncManagerProvider(householdId: id, selectedTab: $selectedTab)
            }
        }
    }
}

struct SyncManagerProvider: View {
    let householdId: String
    @Binding var selectedTab: Int
    @StateObject private var syncManager: SyncManager

    init(householdId: String, selectedTab: Binding<Int>) {
        self.householdId = householdId
        self._selectedTab = selectedTab
        _syncManager = StateObject(wrappedValue: SyncManager(householdId: householdId))
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                WeatherView()
                    .toolbar { headerToolbar }
            }
            .tag(0)
            .tabItem { Label("天気", systemImage: "sun.max.fill") }

            NavigationStack {
                GarbageCalendarView()
                    .toolbar { headerToolbar }
            }
            .tag(1)
            .tabItem { Label("ごみ", systemImage: "calendar.badge.checkmark") }

            NavigationStack {
                ShoppingListView(syncManager: syncManager)
                    .toolbar { headerToolbar }
            }
            .tag(2)
            .tabItem { Label("買い物", systemImage: "cart.fill") }

            NavigationStack {
                MemoView(syncManager: syncManager)
                    .toolbar { headerToolbar }
            }
            .tag(3)
            .tabItem { Label("メモ", systemImage: "note.text") }
        }
        .accentColor(.penguinTeal)
    }

    @ToolbarContentBuilder
    var headerToolbar: some ToolbarContent {
        ToolbarItem(placement: .navigationBarLeading) {
            HStack(spacing: 6) {
                Text("🐧")
                    .font(.title3)
                Text("登戸暮らし")
                    .font(.system(.headline, design: .rounded, weight: .black))
                    .foregroundColor(.white)
            }
        }
        ToolbarItem(placement: .navigationBarTrailing) {
            Text("登戸 · 多摩区")
                .font(.caption2)
                .foregroundColor(.penguinTealLight.opacity(0.7))
        }
    }
}
