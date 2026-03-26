import SwiftUI

struct ShoppingListView: View {
    @ObservedObject var syncManager: SyncManager
    @EnvironmentObject var household: HouseholdManager

    @State private var newItemText = ""
    @State private var selectedCategory: ShoppingCategory = .food
    @State private var filterCategory: ShoppingCategory? = nil
    @State private var showDone = true
    @State private var showClearConfirm = false
    @FocusState private var inputFocused: Bool
    @State private var copiedCode = false

    private var displayItems: [ShoppingItem] {
        syncManager.shoppingItems.filter { item in
            if !showDone && item.isDone { return false }
            if let cat = filterCategory, item.category != cat { return false }
            return true
        }
    }

    private var doneCount: Int { syncManager.shoppingItems.filter(\.isDone).count }
    private var totalCount: Int { syncManager.shoppingItems.count }
    private var progress: Double { totalCount == 0 ? 0 : Double(doneCount) / Double(totalCount) }

    var body: some View {
        ZStack {
            PenguinBackground()
            VStack(spacing: 0) {
                // Sync badge
                if let id = household.householdId {
                    SyncStatusBadge(
                        householdId: id,
                        isSyncing: syncManager.isSyncing,
                        onCopy: { copyCode(id) }
                    )
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .overlay(
                        Group {
                            if copiedCode {
                                Text("コピーしました！")
                                    .font(.caption.bold())
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.penguinTeal)
                                    .cornerRadius(8)
                                    .transition(.scale.combined(with: .opacity))
                            }
                        }
                    )
                }

                // Progress bar
                if totalCount > 0 {
                    progressView
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                }

                // Input row
                inputRow
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)

                // Category filter
                filterRow
                    .padding(.horizontal, 16)
                    .padding(.bottom, 4)

                // List
                if syncManager.shoppingItems.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(displayItems) { item in
                            ShoppingItemRow(item: item) {
                                syncManager.toggleShoppingItem(item)
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 3, leading: 16, bottom: 3, trailing: 16))
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    syncManager.deleteShoppingItem(item)
                                } label: {
                                    Label("削除", systemImage: "trash")
                                }
                            }
                        }
                        // Footer padding
                        Color.clear.frame(height: 20).listRowBackground(Color.clear).listRowSeparator(.hidden)
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }

                Spacer(minLength: 0)
            }

            // Clear done FAB
            if doneCount > 0 {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: { showClearConfirm = true }) {
                            Label("完了済みを削除 (\(doneCount))", systemImage: "checkmark.circle")
                                .font(.caption.bold())
                                .padding(.horizontal, 14)
                                .padding(.vertical, 10)
                                .background(Color.penguinAccent.opacity(0.15))
                                .foregroundColor(.penguinAccent)
                                .cornerRadius(20)
                                .overlay(Capsule().strokeBorder(Color.penguinAccent.opacity(0.3)))
                        }
                        .padding(.trailing, 16)
                        .padding(.bottom, 12)
                    }
                }
            }
        }
        .confirmationDialog("完了済みのアイテムを削除しますか？", isPresented: $showClearConfirm, titleVisibility: .visible) {
            Button("削除する", role: .destructive) { syncManager.clearDoneItems() }
            Button("キャンセル", role: .cancel) {}
        }
    }

    // MARK: - Progress

    private var progressView: some View {
        VStack(spacing: 4) {
            HStack {
                Text("\(doneCount) / \(totalCount) 完了")
                    .font(.caption.bold())
                    .foregroundColor(.white.opacity(0.5))
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.caption.bold())
                    .foregroundColor(progress == 1 ? .penguinBeak : .penguinTealLight)
            }
            ProgressView(value: progress)
                .tint(progress == 1 ? .penguinBeak : .penguinTeal)
                .scaleEffect(x: 1, y: 1.5)

            if progress == 1 {
                Text("🎉 全部そろったペン！ 🐧")
                    .font(.caption.bold())
                    .foregroundColor(.penguinBeak)
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(.spring(), value: progress)
    }

    // MARK: - Input Row

    private var inputRow: some View {
        HStack(spacing: 8) {
            // Category picker
            Menu {
                ForEach(ShoppingCategory.allCases, id: \.rawValue) { cat in
                    Button(action: { selectedCategory = cat }) {
                        Label(cat.label, title: { Text(cat.label) })
                    }
                }
            } label: {
                Text(selectedCategory.icon)
                    .font(.title2)
                    .frame(width: 44, height: 44)
                    .background(.white.opacity(0.08))
                    .cornerRadius(10)
            }

            TextField("追加するものを入力…", text: $newItemText)
                .textFieldStyle(.plain)
                .padding(.horizontal, 14)
                .frame(height: 44)
                .background(.white.opacity(0.08))
                .cornerRadius(10)
                .foregroundColor(.white)
                .focused($inputFocused)
                .onSubmit { addItem() }

            Button(action: addItem) {
                Text("追加")
                    .font(.system(.body, design: .rounded, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 60, height: 44)
                    .background(LinearGradient(colors: [.penguinTeal, .penguinTealDark],
                                               startPoint: .topLeading, endPoint: .bottomTrailing))
                    .cornerRadius(10)
            }
        }
    }

    // MARK: - Filter Row

    private var filterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                filterChip(title: "すべて", isActive: filterCategory == nil) {
                    filterCategory = nil
                }
                ForEach(ShoppingCategory.allCases, id: \.rawValue) { cat in
                    filterChip(title: "\(cat.icon) \(cat.label)", isActive: filterCategory == cat) {
                        filterCategory = (filterCategory == cat) ? nil : cat
                    }
                }
                filterChip(title: showDone ? "✅ 完了を隠す" : "✅ 完了を表示", isActive: !showDone) {
                    showDone.toggle()
                }
            }
        }
    }

    private func filterChip(title: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.caption.bold())
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isActive ? Color.penguinTeal.opacity(0.2) : Color.white.opacity(0.06))
                .foregroundColor(isActive ? .penguinTealLight : .white.opacity(0.6))
                .cornerRadius(20)
                .overlay(
                    Capsule().strokeBorder(isActive ? Color.penguinTeal : Color.white.opacity(0.1), lineWidth: 1)
                )
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            PenguinIllustration(size: 60)
            Text("買い物リストが空ペン")
                .foregroundColor(.white.opacity(0.5))
            Text("上のフォームから追加しよう")
                .font(.caption)
                .foregroundColor(.white.opacity(0.3))
        }
        .frame(maxWidth: .infinity)
        .padding(40)
    }

    // MARK: - Actions

    private func addItem() {
        let text = newItemText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        syncManager.addShoppingItem(text: text, category: selectedCategory)
        newItemText = ""
    }

    private func copyCode(_ code: String) {
        UIPasteboard.general.string = code
        withAnimation { copiedCode = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation { copiedCode = false }
        }
    }
}

// MARK: - Shopping Item Row

struct ShoppingItemRow: View {
    let item: ShoppingItem
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                ZStack {
                    Circle()
                        .stroke(item.isDone ? Color.penguinTeal : Color.white.opacity(0.3), lineWidth: 2)
                        .frame(width: 24, height: 24)
                    if item.isDone {
                        Circle()
                            .fill(Color.penguinTeal)
                            .frame(width: 24, height: 24)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            .buttonStyle(.plain)

            Text(item.category.icon)
                .font(.body)

            Text(item.text)
                .font(.system(.body, design: .rounded))
                .foregroundColor(item.isDone ? .white.opacity(0.4) : .white)
                .strikethrough(item.isDone, color: .white.opacity(0.3))
                .animation(.easeInOut(duration: 0.2), value: item.isDone)

            Spacer()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.white.opacity(item.isDone ? 0.02 : 0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(.white.opacity(0.07), lineWidth: 1)
        )
        .contentShape(Rectangle())
        .animation(.easeInOut(duration: 0.2), value: item.isDone)
    }
}
