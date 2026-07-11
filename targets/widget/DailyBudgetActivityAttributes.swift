import ActivityKit
import Foundation

// SHARED between the app (control module) and the widget extension (UI).
// A copy of this exact struct also lives in
// modules/expo-daily-budget-activity/ios/DailyBudgetActivityAttributes.swift —
// the two MUST stay identical (same name + shape) or ActivityKit won't connect
// the app's activity to this widget's ActivityConfiguration.
@available(iOS 16.1, *)
struct DailyBudgetActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var spentToday: Double
        var dailyLimit: Double
    }

    var currency: String
}
