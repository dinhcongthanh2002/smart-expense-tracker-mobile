import WidgetKit
import SwiftUI

// These MUST match lib/widget.ts and expo-target.config.js / app.json.
private let APP_GROUP = "group.vn.vdcd.smartexpense"
private let SUMMARY_KEY = "widgetSummary"
private let RECENT_KEY = "widgetRecent"
private let WIDGET_KIND = "SmartExpenseWidget"

// Brand colors (mirror theme/colors).
private let brand = Color(red: 0.114, green: 0.62, blue: 0.459)      // #1d9e75
private let expenseColor = Color(red: 0.90, green: 0.30, blue: 0.30)

// MARK: - Model

struct RecentItem: Identifiable {
    let id = UUID()
    let name: String
    let amount: Double
    let type: Int // 0 = expense, 1 = income
}

struct Summary {
    var balance: Double
    var income: Double
    var expense: Double
    var currency: String
    var recent: [RecentItem]

    static let placeholder = Summary(
        balance: 5_230_000, income: 12_000_000, expense: 6_770_000,
        currency: "VND",
        recent: [
            RecentItem(name: "Cà phê", amount: 35_000, type: 0),
            RecentItem(name: "Lương", amount: 12_000_000, type: 1),
            RecentItem(name: "Đi chợ", amount: 250_000, type: 0),
        ])
}

func loadSummary() -> Summary {
    let defaults = UserDefaults(suiteName: APP_GROUP)

    guard let data = defaults?.data(forKey: SUMMARY_KEY),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
        return .placeholder
    }

    var summary = Summary(
        balance: (json["balance"] as? NSNumber)?.doubleValue ?? 0,
        income: (json["income"] as? NSNumber)?.doubleValue ?? 0,
        expense: (json["expense"] as? NSNumber)?.doubleValue ?? 0,
        currency: json["currency"] as? String ?? "VND",
        recent: [])

    if let rdata = defaults?.data(forKey: RECENT_KEY),
       let arr = try? JSONSerialization.jsonObject(with: rdata) as? [[String: Any]] {
        summary.recent = arr.map {
            RecentItem(
                name: $0["name"] as? String ?? "",
                amount: ($0["amount"] as? NSNumber)?.doubleValue ?? 0,
                type: ($0["type"] as? NSNumber)?.intValue ?? 0)
        }
    }
    return summary
}

func formatMoney(_ value: Double, _ currency: String) -> String {
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.maximumFractionDigits = 0
    f.groupingSeparator = "."
    let n = f.string(from: NSNumber(value: value)) ?? "0"
    return currency == "VND" ? "\(n) đ" : n
}

// MARK: - Timeline

struct SummaryEntry: TimelineEntry {
    let date: Date
    let summary: Summary
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SummaryEntry {
        SummaryEntry(date: Date(), summary: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SummaryEntry) -> Void) {
        let s = context.isPreview ? Summary.placeholder : loadSummary()
        completion(SummaryEntry(date: Date(), summary: s))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SummaryEntry>) -> Void) {
        let entry = SummaryEntry(date: Date(), summary: loadSummary())
        // Periodic refresh; the app also nudges via ExtensionStorage.reloadWidget().
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date())
            ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Shared bits

private func widgetBackgroundColor(_ scheme: ColorScheme) -> Color {
    scheme == .dark ? Color(red: 0.043, green: 0.063, blue: 0.125) : .white
}

extension View {
    @ViewBuilder
    func widgetContainerBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

struct StatRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon).font(.system(size: 11, weight: .semibold)).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Spacer(minLength: 4)
            Text(value).font(.caption).fontWeight(.semibold).lineLimit(1).minimumScaleFactor(0.6)
        }
    }
}

// MARK: - Size-specific views

struct SmallView: View {
    let s: Summary
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Số dư tháng").font(.caption2).foregroundStyle(.secondary)
            Text(formatMoney(s.balance, s.currency))
                .font(.system(size: 19, weight: .bold))
                .lineLimit(1).minimumScaleFactor(0.5)
            Spacer(minLength: 0)
            HStack(spacing: 4) {
                Image(systemName: "arrow.up.right").font(.system(size: 10, weight: .bold))
                Text(formatMoney(s.expense, s.currency)).font(.caption2)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
            .foregroundStyle(expenseColor)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct MediumView: View {
    let s: Summary
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tháng này").font(.caption).foregroundStyle(.secondary)
            Text(formatMoney(s.balance, s.currency))
                .font(.system(size: 24, weight: .bold))
                .lineLimit(1).minimumScaleFactor(0.5)
            Spacer(minLength: 0)
            StatRow(icon: "arrow.down.left", label: "Thu", value: formatMoney(s.income, s.currency), color: brand)
            StatRow(icon: "arrow.up.right", label: "Chi", value: formatMoney(s.expense, s.currency), color: expenseColor)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct LargeView: View {
    let s: Summary
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Tháng này").font(.caption).foregroundStyle(.secondary)
            Text(formatMoney(s.balance, s.currency))
                .font(.system(size: 26, weight: .bold))
                .lineLimit(1).minimumScaleFactor(0.5)
            HStack(spacing: 14) {
                StatRow(icon: "arrow.down.left", label: "Thu", value: formatMoney(s.income, s.currency), color: brand)
                StatRow(icon: "arrow.up.right", label: "Chi", value: formatMoney(s.expense, s.currency), color: expenseColor)
            }
            Divider()
            Text("Gần đây").font(.caption2).foregroundStyle(.secondary)
            if s.recent.isEmpty {
                Text("Chưa có giao dịch").font(.caption).foregroundStyle(.secondary)
            } else {
                ForEach(s.recent.prefix(4)) { item in
                    HStack(spacing: 8) {
                        Circle()
                            .fill(item.type == 1 ? brand : expenseColor)
                            .frame(width: 7, height: 7)
                        Text(item.name.isEmpty ? "Giao dịch" : item.name)
                            .font(.caption).lineLimit(1)
                        Spacer(minLength: 4)
                        Text((item.type == 1 ? "+" : "-") + formatMoney(item.amount, s.currency))
                            .font(.caption).fontWeight(.semibold)
                            .foregroundStyle(item.type == 1 ? brand : expenseColor)
                            .lineLimit(1).minimumScaleFactor(0.6)
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct WidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var scheme
    let entry: SummaryEntry

    var body: some View {
        Group {
            switch family {
            case .systemSmall: SmallView(s: entry.summary)
            case .systemLarge: LargeView(s: entry.summary)
            default: MediumView(s: entry.summary)
            }
        }
        .padding(16)
        .widgetContainerBackground(widgetBackgroundColor(scheme))
    }
}

// MARK: - Widget

struct SmartExpenseWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: WIDGET_KIND, provider: Provider()) { entry in
            WidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Smart Expense")
        .description("Số dư và thu chi tháng này.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

@main
struct SmartExpenseWidgetBundle: WidgetBundle {
    var body: some Widget {
        SmartExpenseWidget()
    }
}
