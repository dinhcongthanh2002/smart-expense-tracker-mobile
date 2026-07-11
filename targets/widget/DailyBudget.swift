import WidgetKit
import SwiftUI

// Daily budget widget: "Còn hôm nay: X" + a bar that shrinks and reddens as you
// approach the day's limit. Reuses Provider / SummaryEntry / loadSummary() from index.swift.
// Lock Screen (accessory*) is rendered monochrome by iOS; systemSmall shows full colour.

private let dailyKind = "DailyBudgetWidget"

private func compactMoney(_ v: Double) -> String {
    if v >= 1_000_000 {
        let s = String(format: "%.1f", v / 1_000_000)
        return (s.hasSuffix(".0") ? String(s.dropLast(2)) : s) + "tr"
    }
    if v >= 1_000 { return "\(Int(v / 1_000))k" }
    return "\(Int(v))"
}

// Green (spare) -> red (over) based on how much of the daily limit is spent.
private func budgetColor(_ ratio: Double) -> Color {
    let r = min(max(ratio, 0), 1)
    return Color(hue: 0.33 * (1 - r), saturation: 0.85, brightness: 0.85)
}

// MARK: - Accessory (Lock Screen) views

private struct InlineBudget: View {
    let s: Summary
    var body: some View {
        if s.dailyLimit <= 0 {
            Text("Chưa đặt ngân sách")
        } else {
            Label("Còn \(compactMoney(s.remainingToday))", systemImage: "creditcard")
        }
    }
}

private struct CircularBudget: View {
    let s: Summary
    var body: some View {
        if s.dailyLimit <= 0 {
            Image(systemName: "creditcard")
        } else {
            Gauge(value: s.remainingToday, in: 0...max(s.dailyLimit, 1)) {
                Text("đ")
            } currentValueLabel: {
                Text(compactMoney(s.remainingToday)).minimumScaleFactor(0.5)
            }
            .gaugeStyle(.accessoryCircular)
        }
    }
}

private struct RectangularBudget: View {
    let s: Summary
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Còn hôm nay").font(.caption2)
            if s.dailyLimit <= 0 {
                Text("Chưa đặt ngân sách").font(.caption2)
            } else {
                Text(compactMoney(s.remainingToday)).font(.headline)
                // Remaining bar (shrinks as spend rises). Monochrome on Lock Screen.
                ProgressView(value: max(0, s.dailyLimit - s.spentToday), total: max(s.dailyLimit, 1))
                    .progressViewStyle(.linear)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Home-screen (full colour) view

private struct SmallBudget: View {
    let s: Summary
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Còn hôm nay").font(.caption).foregroundStyle(.secondary)
            if s.dailyLimit <= 0 {
                Spacer(minLength: 0)
                Text("Chưa đặt ngân sách tháng")
                    .font(.footnote).foregroundStyle(.secondary)
                Spacer(minLength: 0)
            } else {
                Text(compactMoney(s.remainingToday))
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(budgetColor(s.dailyRatio))
                    .lineLimit(1).minimumScaleFactor(0.5)
                Spacer(minLength: 0)
                // Remaining capsule — gets shorter and redder as the limit nears.
                GeometryReader { geo in
                    let frac = max(0, 1 - min(s.dailyRatio, 1))
                    ZStack(alignment: .leading) {
                        Capsule().fill(.quaternary).frame(height: 8)
                        Capsule()
                            .fill(budgetColor(s.dailyRatio))
                            .frame(width: max(8, geo.size.width * frac), height: 8)
                    }
                }
                .frame(height: 8)
                Text("Đã chi \(compactMoney(s.spentToday)) / \(compactMoney(s.dailyLimit))")
                    .font(.caption2).foregroundStyle(.secondary)
                    .lineLimit(1).minimumScaleFactor(0.6)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Entry view + widget

struct DailyBudgetEntryView: View {
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var scheme
    let entry: SummaryEntry

    var body: some View {
        switch family {
        case .accessoryInline:
            InlineBudget(s: entry.summary)
        case .accessoryCircular:
            CircularBudget(s: entry.summary)
        case .accessoryRectangular:
            RectangularBudget(s: entry.summary)
        default:
            SmallBudget(s: entry.summary)
                .padding(16)
                .widgetContainerBackground(scheme == .dark
                    ? Color(red: 0.043, green: 0.063, blue: 0.125) : .white)
        }
    }
}

struct DailyBudgetWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: dailyKind, provider: Provider()) { entry in
            DailyBudgetEntryView(entry: entry)
        }
        .configurationDisplayName("Ngân sách hôm nay")
        .description("Số tiền còn được chi trong ngày.")
        .supportedFamilies([
            .systemSmall,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
