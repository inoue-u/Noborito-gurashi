import SwiftUI

struct HouseholdSetupView: View {
    @EnvironmentObject var household: HouseholdManager
    @State private var mode: Mode = .none
    @State private var joinCode = ""
    @State private var errorMsg = ""
    @FocusState private var codeFocused: Bool

    enum Mode { case none, join }

    var body: some View {
        ZStack {
            PenguinBackground()

            VStack(spacing: 32) {
                Spacer()

                // ペンギンロゴ
                HStack(spacing: 0) {
                    PenguinIllustration(size: 70)
                    PenguinIllustration(size: 70)
                }

                VStack(spacing: 8) {
                    Text("登戸暮らし")
                        .font(.system(size: 36, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                    Text("川崎市多摩区 登戸 二人の生活アプリ")
                        .font(.subheadline)
                        .foregroundColor(.penguinTealLight)
                }

                if mode == .none {
                    VStack(spacing: 14) {
                        Button(action: {
                            household.createHousehold()
                        }) {
                            VStack(spacing: 4) {
                                Label("新しく始める", systemImage: "house.fill")
                                    .font(.system(.body, design: .rounded, weight: .bold))
                                Text("コードを発行して相手を招待")
                                    .font(.caption)
                                    .opacity(0.75)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                        }
                        .background(
                            LinearGradient(colors: [.penguinTeal, .penguinTealDark],
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .foregroundColor(.white)
                        .cornerRadius(16)
                        .shadow(color: .penguinTeal.opacity(0.35), radius: 12, y: 6)

                        Button(action: { mode = .join }) {
                            VStack(spacing: 4) {
                                Label("コードで参加する", systemImage: "key.fill")
                                    .font(.system(.body, design: .rounded, weight: .bold))
                                Text("相手から受け取ったコードを入力")
                                    .font(.caption)
                                    .opacity(0.7)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                        }
                        .background(.white.opacity(0.06))
                        .foregroundColor(.white)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(.white.opacity(0.15), lineWidth: 1)
                        )
                    }
                    .padding(.horizontal, 28)
                } else {
                    // Join form
                    VStack(spacing: 16) {
                        Text("招待コードを入力")
                            .font(.subheadline)
                            .foregroundColor(.penguinTealLight.opacity(0.8))

                        TextField("例: ABC123", text: $joinCode)
                            .textInputAutocapitalization(.characters)
                            .autocorrectionDisabled()
                            .font(.system(size: 28, weight: .black, design: .monospaced))
                            .multilineTextAlignment(.center)
                            .padding(16)
                            .background(.white.opacity(0.08))
                            .cornerRadius(14)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .strokeBorder(.penguinTeal.opacity(0.5), lineWidth: 2)
                            )
                            .foregroundColor(.white)
                            .focused($codeFocused)
                            .onAppear { codeFocused = true }

                        if !errorMsg.isEmpty {
                            Text(errorMsg)
                                .font(.caption)
                                .foregroundColor(.penguinAccent)
                        }

                        HStack(spacing: 12) {
                            Button("戻る") {
                                mode = .none
                                errorMsg = ""
                                joinCode = ""
                            }
                            .foregroundColor(.white.opacity(0.6))
                            .padding(.vertical, 14)
                            .frame(maxWidth: .infinity)
                            .background(.white.opacity(0.06))
                            .cornerRadius(12)

                            Button("参加する") {
                                if household.joinHousehold(code: joinCode) {
                                    // success - RootView will navigate away
                                } else {
                                    errorMsg = "コードが短すぎます（4文字以上）"
                                }
                            }
                            .foregroundColor(.white)
                            .fontWeight(.bold)
                            .padding(.vertical, 14)
                            .frame(maxWidth: .infinity)
                            .background(LinearGradient(colors: [.penguinTeal, .penguinTealDark],
                                                       startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal, 28)
                }

                Spacer()
            }
        }
    }
}
