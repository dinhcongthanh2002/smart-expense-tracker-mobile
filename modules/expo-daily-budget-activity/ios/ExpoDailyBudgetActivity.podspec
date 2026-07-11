Pod::Spec.new do |s|
  s.name           = 'ExpoDailyBudgetActivity'
  s.version        = '1.0.0'
  s.summary        = 'Daily-budget Live Activity control (ActivityKit).'
  s.description    = 'Local Expo module bridging ActivityKit start/update/end to JS.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  # Match the app's min iOS; ActivityKit usage is gated with @available/#available.
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
