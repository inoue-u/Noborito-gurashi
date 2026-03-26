import SwiftUI

#if canImport(FirebaseCore)
import FirebaseCore
#endif

@main
struct NoboritorGurashiApp: App {
    @StateObject private var household = HouseholdManager()

    init() {
        #if canImport(FirebaseCore)
        FirebaseApp.configure()
        #endif
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(household)
                .preferredColorScheme(.dark)
        }
    }

    private func configureAppearance() {
        // タブバー
        let tabBar = UITabBarAppearance()
        tabBar.configureWithOpaqueBackground()
        tabBar.backgroundColor = UIColor(red: 0.04, green: 0.04, blue: 0.12, alpha: 0.95)
        let teal = UIColor(red: 0, green: 0.706, blue: 0.847, alpha: 1)
        tabBar.stackedLayoutAppearance.selected.iconColor = teal
        tabBar.stackedLayoutAppearance.selected.titleTextAttributes = [.foregroundColor: teal]
        tabBar.stackedLayoutAppearance.normal.iconColor = UIColor.white.withAlphaComponent(0.38)
        tabBar.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.white.withAlphaComponent(0.38)
        ]
        UITabBar.appearance().standardAppearance = tabBar
        UITabBar.appearance().scrollEdgeAppearance = tabBar

        // ナビゲーションバー
        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = UIColor(red: 0.04, green: 0.04, blue: 0.12, alpha: 0.9)
        nav.titleTextAttributes = [.foregroundColor: UIColor.white]
        nav.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
        UINavigationBar.appearance().tintColor = teal
    }
}
