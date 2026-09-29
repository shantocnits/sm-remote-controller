Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$apkPath = (Resolve-Path "android\app\build\outputs\apk\debug\app-debug.apk").Path
$bundlePath = (Resolve-Path "android\app\src\main\assets\index.android.bundle").Path

Write-Host "Updating APK: $apkPath"
Write-Host "With Bundle: $bundlePath"

$mode = [System.IO.Compression.ZipArchiveMode]::Update
$zip = [System.IO.Compression.ZipFile]::Open($apkPath, $mode)

$entry = $zip.GetEntry("assets/index.android.bundle")
if ($entry -ne $null) {
    $entry.Delete()
    Write-Host "Old bundle entry removed from APK"
}

[System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $bundlePath, "assets/index.android.bundle")
$zip.Dispose()

Write-Host "SUCCESS: APK successfully updated with new index.android.bundle!"
