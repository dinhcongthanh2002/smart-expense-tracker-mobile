# Build + install the Android dev-client on the running emulator, then start Metro.
# Prereq (ONE-TIME, needs Admin): enable Windows Long Paths, then reboot / new terminal:
#   Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -Type DWord
# Usage (normal terminal): powershell -ExecutionPolicy Bypass -File .\run-android.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$env:ANDROID_HOME = "C:\Users\dinhc\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"

# Warn if Long Paths is still disabled (the build will otherwise fail at ~260 chars).
$lp = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
if ($lp -ne 1) {
  Write-Host "WARNING: Windows LongPathsEnabled is not 1. The native build will likely fail." -ForegroundColor Yellow
  Write-Host "Run this in an ADMIN PowerShell, then reboot/new terminal:" -ForegroundColor Yellow
  Write-Host '  Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -Type DWord' -ForegroundColor Yellow
}

Write-Host "`n[1/3] Building x86_64 debug APK (emulator ABI)..." -ForegroundColor Cyan
Push-Location android
& .\gradlew.bat app:assembleDebug -PreactNativeArchitectures=x86_64 -PreactNativeDevServerPort=19000
Pop-Location

$apk = "android\app\build\outputs\apk\debug\app-debug.apk"
Write-Host "`n[2/3] Installing $apk ..." -ForegroundColor Cyan
& $adb install -r $apk

Write-Host "`n[3/3] Starting Metro (port 19000). Press 'a' to open the app on the emulator." -ForegroundColor Cyan
npx expo start --dev-client --port 19000
