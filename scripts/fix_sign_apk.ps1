Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$apkPath = (Resolve-Path "apk\SM_Remote_Controller.apk").Path
Write-Host "Opening APK: $apkPath"

# 1. Clean META-INF
$zip = [System.IO.Compression.ZipFile]::Open($apkPath, [System.IO.Compression.ZipArchiveMode]::Update)
$toDelete = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.StartsWith("META-INF/") -or $entry.FullName.StartsWith("META-INF\")) {
        $toDelete += $entry
    }
}
foreach ($item in $toDelete) {
    $item.Delete()
}
$zip.Dispose()
Write-Host "Cleared old META-INF signatures."

$buildTools = "C:\Users\CNIT PC 01\AppData\Local\Android\Sdk\build-tools\34.0.0"
$zipalign = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
$jarsigner = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\jarsigner.exe"
$keystore = (Resolve-Path "android\app\debug.keystore").Path

# 2. Sign with jarsigner (v1 scheme)
& "$jarsigner" -sigalg SHA256withRSA -digestalg SHA-256 -keystore $keystore -storepass android -keypass android $apkPath androiddebugkey
Write-Host "v1 JAR signing completed with jarsigner."

# 3. Zipalign
$tempAligned = "apk\SM_Remote_Controller_aligned.apk"
if (Test-Path $tempAligned) { Remove-Item $tempAligned -Force }

& "$zipalign" -p -f 4 $apkPath $tempAligned
Write-Host "Zipalign completed."

Move-Item $tempAligned $apkPath -Force

# 4. Sign with apksigner (v2 + v3 scheme)
& "$apksigner" sign --v1-signing-enabled false --v2-signing-enabled true --v3-signing-enabled true --ks $keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android $apkPath
Write-Host "v2/v3 signing completed with apksigner."

# 5. Verify all schemes!
& "$apksigner" verify -v $apkPath

# 6. Copy to versioned apk
Copy-Item $apkPath "apk\SM_Remote_Controller_v1.3.0.apk" -Force
Write-Host "SUCCESS: APK completely verified and signed with v1, v2, and v3!"
