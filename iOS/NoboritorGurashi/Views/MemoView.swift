import SwiftUI

struct MemoView: View {
    @ObservedObject var syncManager: SyncManager
    @EnvironmentObject var household: HouseholdManager

    @State private var showEditor = false
    @State private var editingMemo: MemoItem? = nil
    @State private var searchText = ""
    @State private var copiedCode = false

    private var filteredMemos: [MemoItem] {
        if searchText.isEmpty { return syncManager.memos }
        let q = searchText.lowercased()
        return syncManager.memos.filter {
            $0.title.lowercased().contains(q) || $0.body.lowercased().contains(q)
        }
    }

    private let columns = [GridItem(.flexible()), GridItem(.flexible())]

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
                }

                // Search
                if syncManager.memos.count > 2 {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.white.opacity(0.4))
                        TextField("メモを検索…", text: $searchText)
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 14)
                    .frame(height: 40)
                    .background(.white.opacity(0.07))
                    .cornerRadius(10)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                }

                if syncManager.memos.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(filteredMemos) { memo in
                                MemoCard(memo: memo) {
                                    editingMemo = memo
                                    showEditor = true
                                } onDelete: {
                                    syncManager.deleteMemo(memo)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 100)
                    }
                }
            }

            // FAB
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button(action: {
                        editingMemo = nil
                        showEditor = true
                    }) {
                        Image(systemName: "plus")
                            .font(.title2.bold())
                            .foregroundColor(.white)
                            .frame(width: 56, height: 56)
                            .background(
                                LinearGradient(colors: [.penguinTeal, .penguinTealDark],
                                               startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .clipShape(Circle())
                            .shadow(color: .penguinTeal.opacity(0.4), radius: 12, y: 4)
                    }
                    .padding(.trailing, 20)
                    .padding(.bottom, 20)
                }
            }
        }
        .sheet(isPresented: $showEditor) {
            MemoEditorView(
                existing: editingMemo,
                onSave: { memo in
                    syncManager.saveMemo(memo)
                    showEditor = false
                },
                onCancel: { showEditor = false }
            )
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            PenguinIllustration(size: 60)
            Text("メモはまだないペン")
                .foregroundColor(.white.opacity(0.5))
            Text("「＋」ボタンから追加しよう")
                .font(.caption)
                .foregroundColor(.white.opacity(0.3))
            Spacer()
        }
    }

    private func copyCode(_ code: String) {
        UIPasteboard.general.string = code
        withAnimation { copiedCode = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation { copiedCode = false }
        }
    }
}

// MARK: - Memo Card

struct MemoCard: View {
    let memo: MemoItem
    let onEdit: () -> Void
    let onDelete: () -> Void
    @State private var showActions = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(memo.title)
                    .font(.system(.subheadline, design: .rounded, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                Spacer()
                Menu {
                    Button(action: onEdit) { Label("編集", systemImage: "pencil") }
                    Button(role: .destructive, action: onDelete) { Label("削除", systemImage: "trash") }
                } label: {
                    Image(systemName: "ellipsis")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.4))
                        .padding(8)
                }
            }

            if !memo.body.isEmpty {
                Text(memo.body)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                    .lineLimit(5)
            }

            Spacer(minLength: 0)

            Text(memo.updatedAt, style: .date)
                .font(.system(size: 10))
                .foregroundColor(.white.opacity(0.3))
        }
        .padding(14)
        .frame(minHeight: 100, alignment: .topLeading)
        .background(memo.color.color.opacity(0.12))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(memo.color.color.opacity(0.35), lineWidth: 1)
        )
    }
}

// MARK: - Memo Editor

struct MemoEditorView: View {
    let existing: MemoItem?
    let onSave: (MemoItem) -> Void
    let onCancel: () -> Void

    @State private var title: String
    @State private var body: String
    @State private var color: MemoColor
    @FocusState private var titleFocused: Bool

    init(existing: MemoItem?, onSave: @escaping (MemoItem) -> Void, onCancel: @escaping () -> Void) {
        self.existing = existing
        self.onSave = onSave
        self.onCancel = onCancel
        _title = State(initialValue: existing?.title ?? "")
        _body = State(initialValue: existing?.body ?? "")
        _color = State(initialValue: existing?.color ?? .teal)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                PenguinBackground()

                VStack(spacing: 16) {
                    // Color picker
                    HStack(spacing: 12) {
                        ForEach(MemoColor.allCases, id: \.rawValue) { c in
                            Circle()
                                .fill(c.color)
                                .frame(width: 28, height: 28)
                                .overlay(
                                    Circle().strokeBorder(color == c ? .white : .clear, lineWidth: 3)
                                )
                                .scaleEffect(color == c ? 1.2 : 1)
                                .onTapGesture { withAnimation(.spring()) { color = c } }
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 4)

                    // Title
                    TextField("タイトル", text: $title)
                        .font(.system(.title3, design: .rounded, weight: .bold))
                        .foregroundColor(.white)
                        .padding(14)
                        .background(color.color.opacity(0.1))
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(color.color.opacity(0.3)))
                        .focused($titleFocused)

                    // Body
                    TextEditor(text: $body)
                        .font(.system(.body, design: .rounded))
                        .foregroundColor(.white)
                        .scrollContentBackground(.hidden)
                        .padding(14)
                        .frame(minHeight: 160)
                        .background(color.color.opacity(0.07))
                        .cornerRadius(12)
                        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(color.color.opacity(0.2)))

                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
            .navigationTitle(existing == nil ? "新しいメモ" : "メモを編集")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル", action: onCancel)
                        .foregroundColor(.penguinTealLight)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        var memo = existing ?? MemoItem(title: "")
                        memo.title = title.isEmpty ? "無題のメモ" : title
                        memo.body = body
                        memo.color = color
                        onSave(memo)
                    }
                    .font(.body.bold())
                    .foregroundColor(.penguinTeal)
                }
            }
        }
        .onAppear { titleFocused = true }
    }
}
