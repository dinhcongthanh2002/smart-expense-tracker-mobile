import ActivityKit
import ExpoModulesCore
import Foundation

// Bridges ActivityKit to JS. JS name: "DailyBudgetActivity".
public class DailyBudgetActivityModule: Module {
    public func definition() -> ModuleDefinition {
        Name("DailyBudgetActivity")

        // Whether the user has Live Activities enabled for this app.
        Function("isEnabled") { () -> Bool in
            if #available(iOS 16.2, *) {
                return ActivityAuthorizationInfo().areActivitiesEnabled
            }
            return false
        }

        // Start a new daily-budget Live Activity; returns its id (or nil).
        Function("start") { (spent: Double, limit: Double, currency: String) -> String? in
            if #available(iOS 16.2, *) {
                let attributes = DailyBudgetActivityAttributes(currency: currency)
                let state = DailyBudgetActivityAttributes.ContentState(
                    spentToday: spent, dailyLimit: limit)
                do {
                    let activity = try Activity.request(
                        attributes: attributes,
                        content: ActivityContent(state: state, staleDate: nil),
                        pushType: nil)
                    return activity.id
                } catch {
                    return nil
                }
            }
            return nil
        }

        // Update an existing activity's state.
        AsyncFunction("update") { (id: String, spent: Double, limit: Double) in
            if #available(iOS 16.2, *) {
                let state = DailyBudgetActivityAttributes.ContentState(
                    spentToday: spent, dailyLimit: limit)
                let content = ActivityContent(state: state, staleDate: nil)
                for activity in Activity<DailyBudgetActivityAttributes>.activities where activity.id == id {
                    await activity.update(content)
                }
            }
        }

        // End a specific activity.
        AsyncFunction("end") { (id: String) in
            if #available(iOS 16.2, *) {
                for activity in Activity<DailyBudgetActivityAttributes>.activities where activity.id == id {
                    await activity.end(nil, dismissalPolicy: .immediate)
                }
            }
        }

        // End all daily-budget activities.
        AsyncFunction("endAll") {
            if #available(iOS 16.2, *) {
                for activity in Activity<DailyBudgetActivityAttributes>.activities {
                    await activity.end(nil, dismissalPolicy: .immediate)
                }
            }
        }
    }
}
