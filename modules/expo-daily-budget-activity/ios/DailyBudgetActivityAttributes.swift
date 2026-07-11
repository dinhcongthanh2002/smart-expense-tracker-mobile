import ActivityKit
import Foundation

// MUST stay IDENTICAL to targets/widget/DailyBudgetActivityAttributes.swift
// (same name + shape) so ActivityKit connects the app's activity to the widget's
// ActivityConfiguration UI.
@available(iOS 16.1, *)
struct DailyBudgetActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var spentToday: Double
        var dailyLimit: Double
    }

    var currency: String
}
