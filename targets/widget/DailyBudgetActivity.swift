import ActivityKit
import WidgetKit
import SwiftUI

// Live Activity + Dynamic Island for the daily budget.
// Unlike Lock Screen accessory widgets, Live Activities render in FULL COLOUR —
// so the green→red bar shows properly on the Lock Screen and in the Dynamic Island.

private func liveCompact(_ v: Double) -> String {
    if v >= 1_000_000 {
        let s = String(format: "%.1f", v / 1_000_000)
        return (s.hasSuffix(".0") ? String(s.dropLast(2)) : s) + "tr"
    }
    if v >= 1_000 { return "\(Int(v / 1_000))k" }
    return "\(Int(v))"
}

private func liveColor(_ ratio: Double) -> Color {
    let r = min(max(ratio, 0), 1)
    return Color(hue: 0.33 * (1 - r), saturation: 0.85, brightness: 0.9)
}

@available(iOS 16.2, *)
private struct LiveBar: View {
    let ratio: Double
    var body: some View {
        GeometryReader { geo in
            // Remaining bar: shrinks as spend approaches the limit, greens → reds.
            let frac = max(0, 1 - min(ratio, 1))
            ZStack(alignment: .leading) {
                Capsule().fill(.white.opacity(0.18)).frame(height: 8)
                Capsule().fill(liveColor(ratio))
                    .frame(width: max(8, geo.size.width * frac), height: 8)
            }
        }
        .frame(height: 8)
    }
}

@available(iOS 16.2, *)
private struct LiveLockView: View {
    let state: DailyBudgetActivityAttributes.ContentState
    let currency: String
    var body: some View {
        let remaining = max(0, state.dailyLimit - state.spentToday)
        let ratio = state.dailyLimit > 0 ? min(state.spentToday / state.dailyLimit, 1) : 0
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Ngân sách hôm nay", systemImage: "creditcard")
                    .font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("Còn \(liveCompact(remaining))")
                    .font(.headline).foregroundStyle(liveColor(ratio))
            }
            LiveBar(ratio: ratio)
            Text("Đã chi \(liveCompact(state.spentToday)) / \(liveCompact(state.dailyLimit))")
                .font(.caption2).foregroundStyle(.secondary)
        }
    }
}

@available(iOS 16.2, *)
struct DailyBudgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DailyBudgetActivityAttributes.self) { context in
            LiveLockView(state: context.state, currency: context.attributes.currency)
                .padding(14)
                .activityBackgroundTint(Color.black.opacity(0.35))
        } dynamicIsland: { context in
            let s = context.state
            let remaining = max(0, s.dailyLimit - s.spentToday)
            let ratio = s.dailyLimit > 0 ? min(s.spentToday / s.dailyLimit, 1) : 0
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Còn", systemImage: "creditcard").font(.caption)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(liveCompact(remaining))
                        .font(.headline).foregroundStyle(liveColor(ratio))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    LiveBar(ratio: ratio)
                }
            } compactLeading: {
                Image(systemName: "creditcard")
            } compactTrailing: {
                Text(liveCompact(remaining)).foregroundStyle(liveColor(ratio))
            } minimal: {
                Text(liveCompact(remaining)).foregroundStyle(liveColor(ratio))
            }
            .keylineTint(liveColor(ratio))
        }
    }
}
