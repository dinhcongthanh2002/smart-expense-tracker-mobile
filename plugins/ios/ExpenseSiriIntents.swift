import AppIntents
import Foundation

// Siri / App Shortcuts integration for Smart Expense.
//
// Lets the user say e.g. "Thêm giao dịch Ăn bánh mì hôm nay lúc 8 giờ sáng vào
// Smart Expense" and have the transaction created in the backend, without
// opening the app. The intent mirrors the in-app voice flow (QuickAddSheet):
//   1. POST /transactions/parse  — backend turns the phrase into a draft
//      (type, amount, category, wallet, date) using the user's own categories.
//   2. POST /transactions        — persists the draft.
//
// The session (access token + API base URL) is shared from the JS app through
// the App Group by lib/siri-bridge.ts. Keys here MUST match that file.
private let APP_GROUP = "group.vn.vdcd.smartexpense"
private let AUTH_KEY = "siriAuth"

// MARK: - Shared session

private struct SiriAuth {
    let token: String
    let baseUrl: String
}

private func loadAuth() -> SiriAuth? {
    guard let defaults = UserDefaults(suiteName: APP_GROUP),
          let data = defaults.data(forKey: AUTH_KEY),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let token = json["token"] as? String, !token.isEmpty,
          let baseUrl = json["baseUrl"] as? String, !baseUrl.isEmpty
    else { return nil }
    return SiriAuth(token: token, baseUrl: baseUrl.hasSuffix("/") ? String(baseUrl.dropLast()) : baseUrl)
}

// MARK: - API models

// Backend envelope: { code, message, data }.
private struct ApiResponse<T: Decodable>: Decodable {
    let code: Int?
    let message: String?
    let data: T?
}

// Draft returned by /transactions/parse (see store/transaction/model.ts).
private struct ParseResult: Decodable {
    let draft: Draft?
    let confidence: Double?
    let unresolved: [String]?
}

private struct Draft: Decodable {
    let type: Int            // 0 = Expense, 1 = Income, 2 = Transfer
    let amount: Double
    let categoryId: String?
    let categoryName: String?
    let walletId: String?
    let note: String?
    let transactionDate: String?
}

// Body for POST /transactions (TransactionCreateUpdateModel).
private struct CreateBody: Encodable {
    let categoryId: String?
    let amount: Double
    let type: Int
    let note: String?
    let transactionDate: String
    let walletId: String?
}

// Body for POST /debts (DebtCreateModel). type: 0 = Borrow (đi vay), 1 = Lend (cho vay).
private struct DebtBody: Encodable {
    let personName: String
    let type: Int
    let totalAmount: Double
    let startDate: String
    let dueDate: String?
    let note: String?
}

private struct TransactionView: Decodable {
    let id: String?
    let amount: Double?
    let type: Int?
}

private enum IntentError: Error {
    case notLoggedIn
    case network
    case parseFailed
}

// MARK: - API client

private struct ExpenseAPI {
    let auth: SiriAuth

    private func request(_ path: String, body: Data) async throws -> Data {
        guard let url = URL(string: auth.baseUrl + path) else { throw IntentError.network }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("vi", forHTTPHeaderField: "Accept-Language")
        req.setValue("Bearer \(auth.token)", forHTTPHeaderField: "Authorization")
        req.httpBody = body
        req.timeoutInterval = 20

        let (data, response) = try await URLSession.shared.data(for: req)
        if let http = response as? HTTPURLResponse {
            if http.statusCode == 401 { throw IntentError.notLoggedIn }
            guard (200...299).contains(http.statusCode) else { throw IntentError.network }
        }
        return data
    }

    /// Ask the backend to turn a spoken phrase into a draft transaction.
    func parse(text: String) async throws -> Draft {
        let body = try JSONSerialization.data(withJSONObject: ["text": text])
        let data = try await request("/transactions/parse", body: body)
        let decoded = try JSONDecoder().decode(ApiResponse<ParseResult>.self, from: data)
        guard let draft = decoded.data?.draft else { throw IntentError.parseFailed }
        return draft
    }

    /// Persist a draft as a real transaction.
    func create(from draft: Draft) async throws {
        let body = CreateBody(
            categoryId: draft.categoryId,
            amount: draft.amount,
            type: draft.type,
            note: draft.note,
            transactionDate: draft.transactionDate ?? isoNow(),
            walletId: draft.walletId
        )
        let data = try await request("/transactions", body: try JSONEncoder().encode(body))
        // Decoding is best-effort: a 2xx already means it was created.
        _ = try? JSONDecoder().decode(ApiResponse<TransactionView>.self, from: data)
    }

    /// Extract a VND amount from a spoken phrase by reusing the transaction
    /// parser (handles "hai trăm nghìn", "2 triệu", "50k"…). Debts have no
    /// parse endpoint of their own, so we borrow this one just for the number.
    func parseAmount(text: String) async throws -> Double {
        let draft = try await parse(text: text)
        return draft.amount
    }

    /// Create a debt (type 0 = Borrow / đi vay, 1 = Lend / cho vay). No wallet is
    /// attached: a wallet-linked debt requires a matching "vay mượn"/"cho vay"
    /// category on the server, so Siri only records the debt for tracking and
    /// lets the user link a wallet later in the app.
    func createDebt(personName: String, type: Int, amount: Double, note: String?) async throws {
        let body = DebtBody(
            personName: personName,
            type: type,
            totalAmount: amount,
            startDate: isoNow(),
            dueDate: nil,
            note: note
        )
        _ = try await request("/debts", body: try JSONEncoder().encode(body))
    }
}

// MARK: - Helpers

private func isoNow() -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f.string(from: Date())
}

private func formatMoney(_ value: Double) -> String {
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.maximumFractionDigits = 0
    f.groupingSeparator = "."
    let n = f.string(from: NSNumber(value: value)) ?? "0"
    return "\(n) đ"
}

// MARK: - Intent

@available(iOS 16.0, *)
struct AddTransactionIntent: AppIntent {
    static var title: LocalizedStringResource = "Thêm giao dịch"
    static var description = IntentDescription(
        "Ghi nhanh một giao dịch chi tiêu hoặc thu nhập bằng giọng nói.")

    // Run in the background — no need to bring the app to the foreground.
    static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Nội dung",
        description: "Mô tả giao dịch, ví dụ: Ăn bánh mì 20 nghìn sáng nay.",
        requestValueDialog: IntentDialog("Bạn muốn ghi giao dịch gì?")
    )
    var content: String

    static var parameterSummary: some ParameterSummary {
        Summary("Thêm giao dịch \(\.$content)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let auth = loadAuth() else {
            return .result(dialog: IntentDialog(
                "Bạn cần mở ứng dụng Smart Expense và đăng nhập trước khi dùng Siri."))
        }

        let api = ExpenseAPI(auth: auth)

        let draft: Draft
        do {
            draft = try await api.parse(text: content)
        } catch IntentError.notLoggedIn {
            return .result(dialog: IntentDialog(
                "Phiên đăng nhập đã hết hạn. Mở ứng dụng Smart Expense và đăng nhập lại nhé."))
        } catch {
            return .result(dialog: IntentDialog(
                "Mình chưa kết nối được tới Smart Expense. Thử lại sau nhé."))
        }

        // Need a positive amount and a resolved category for Expense/Income.
        let needsReview = draft.amount <= 0
            || (draft.type != 2 && (draft.categoryId == nil || draft.categoryId?.isEmpty == true))
        if needsReview {
            return .result(dialog: IntentDialog(
                "Mình chưa chắc về số tiền hoặc danh mục cho \"\(content)\". Bạn mở ứng dụng để kiểm tra lại nhé."))
        }

        do {
            try await api.create(from: draft)
        } catch {
            return .result(dialog: IntentDialog(
                "Mình chưa lưu được giao dịch. Thử lại sau nhé."))
        }

        let kind = draft.type == 1 ? "thu nhập" : "chi tiêu"
        let name = (draft.note?.isEmpty == false ? draft.note! : (draft.categoryName ?? "giao dịch"))
        return .result(dialog: IntentDialog(
            "Đã thêm \(kind) \(formatMoney(draft.amount)) cho \(name)."))
    }
}

// MARK: - Debt intents (đi vay / cho vay)

// Shared implementation for both debt directions. Reuses the transaction parser
// to turn the spoken amount into a number.
@available(iOS 16.0, *)
private func performAddDebt(
    type: Int, person: String, amountText: String, verb: String
) async -> some IntentResult & ProvidesDialog {
    guard let auth = loadAuth() else {
        return .result(dialog: IntentDialog(
            "Bạn cần mở ứng dụng Smart Expense và đăng nhập trước khi dùng Siri."))
    }
    let api = ExpenseAPI(auth: auth)

    let amount: Double
    do {
        amount = try await api.parseAmount(text: amountText)
    } catch IntentError.notLoggedIn {
        return .result(dialog: IntentDialog(
            "Phiên đăng nhập đã hết hạn. Mở ứng dụng Smart Expense và đăng nhập lại nhé."))
    } catch {
        return .result(dialog: IntentDialog(
            "Mình chưa kết nối được tới Smart Expense. Thử lại sau nhé."))
    }
    if amount <= 0 {
        return .result(dialog: IntentDialog(
            "Mình chưa nhận ra số tiền. Bạn thử nói lại số tiền nhé."))
    }

    do {
        try await api.createDebt(personName: person, type: type, amount: amount, note: nil)
    } catch {
        return .result(dialog: IntentDialog("Mình chưa lưu được khoản \(verb). Thử lại sau nhé."))
    }

    let who = person.trimmingCharacters(in: .whitespaces).isEmpty ? "" : " với \(person)"
    return .result(dialog: IntentDialog("Đã ghi khoản \(verb) \(formatMoney(amount))\(who)."))
}

@available(iOS 16.0, *)
struct AddBorrowDebtIntent: AppIntent {
    static var title: LocalizedStringResource = "Ghi khoản đi vay"
    static var description = IntentDescription("Ghi một khoản bạn vay/nợ người khác.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Người cho vay",
               requestValueDialog: IntentDialog("Bạn vay của ai?"))
    var person: String

    @Parameter(title: "Số tiền",
               requestValueDialog: IntentDialog("Số tiền vay là bao nhiêu?"))
    var amountText: String

    static var parameterSummary: some ParameterSummary {
        Summary("Ghi vay \(\.$amountText) của \(\.$person)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        await performAddDebt(type: 0, person: person, amountText: amountText, verb: "vay")
    }
}

@available(iOS 16.0, *)
struct AddLoanIntent: AppIntent {
    static var title: LocalizedStringResource = "Ghi khoản cho vay"
    static var description = IntentDescription("Ghi một khoản bạn cho người khác vay.")
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Người vay",
               requestValueDialog: IntentDialog("Bạn cho ai vay?"))
    var person: String

    @Parameter(title: "Số tiền",
               requestValueDialog: IntentDialog("Số tiền cho vay là bao nhiêu?"))
    var amountText: String

    static var parameterSummary: some ParameterSummary {
        Summary("Ghi cho \(\.$person) vay \(\.$amountText)")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        await performAddDebt(type: 1, person: person, amountText: amountText, verb: "cho vay")
    }
}

// MARK: - App Shortcuts (phrases Siri recognizes without any setup)

@available(iOS 16.0, *)
struct ExpenseAppShortcuts: AppShortcutsProvider {
    // App Shortcut phrases may ONLY embed AppEnum/AppEntity parameters — a free
    // text String (content/person) is NOT allowed inside a phrase. So the
    // phrases are static; after Siri triggers the intent it asks for the details
    // via each parameter's requestValueDialog ("Bạn muốn ghi giao dịch gì?"…).
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTransactionIntent(),
            phrases: [
                "Thêm giao dịch vào \(.applicationName)",
                "Thêm giao dịch trong \(.applicationName)",
                "Ghi giao dịch vào \(.applicationName)",
                "Ghi chi tiêu vào \(.applicationName)",
                "\(.applicationName) thêm giao dịch",
            ],
            shortTitle: "Thêm giao dịch",
            systemImageName: "plus.circle.fill"
        )
        AppShortcut(
            intent: AddBorrowDebtIntent(),
            phrases: [
                "Ghi khoản đi vay vào \(.applicationName)",
                "Thêm khoản nợ vào \(.applicationName)",
                "\(.applicationName) ghi khoản đi vay",
            ],
            shortTitle: "Ghi khoản đi vay",
            systemImageName: "arrow.down.circle.fill"
        )
        AppShortcut(
            intent: AddLoanIntent(),
            phrases: [
                "Ghi khoản cho vay vào \(.applicationName)",
                "Thêm khoản cho vay vào \(.applicationName)",
                "\(.applicationName) ghi khoản cho vay",
            ],
            shortTitle: "Ghi khoản cho vay",
            systemImageName: "arrow.up.circle.fill"
        )
    }
}
