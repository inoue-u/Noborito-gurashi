import SwiftUI

struct ContentView: View {
    @EnvironmentObject var household: HouseholdManager

    var body: some View {
        if household.householdId == nil {
            HouseholdSetupView()
        } else if let id = household.householdId {
            SyncManagerProvider(householdId: id, selectedTab: .constant(0))
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(HouseholdManager())
}
