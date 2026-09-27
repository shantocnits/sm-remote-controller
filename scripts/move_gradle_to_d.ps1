Write-Host "Configuring Gradle to use D:\.gradle (130GB free space)..." -ForegroundColor Cyan

# 1. Set GRADLE_USER_HOME environment variable to D:\.gradle
$gradleHome = "D:\.gradle"
if (-not (Test-Path $gradleHome)) {
    New-Item -ItemType Directory -Path $gradleHome -Force | Out-Null
}
[System.Environment]::SetEnvironmentVariable("GRADLE_USER_HOME", $gradleHome, "User")
[System.Environment]::SetEnvironmentVariable("GRADLE_USER_HOME", $gradleHome, "Process")
Write-Host "[OK] GRADLE_USER_HOME set to: $gradleHome" -ForegroundColor Green

# 2. Add Windows Defender exclusion for D:\.gradle
try {
    Add-MpPreference -ExclusionPath @("D:\.gradle") -ErrorAction SilentlyContinue
    Write-Host "[OK] Defender exclusion added for D:\.gradle" -ForegroundColor Green
} catch {}

# 3. Clean Temp files on C: drive
Write-Host "Cleaning temporary files on C: drive..." -ForegroundColor Cyan
$tempDir = [System.IO.Path]::GetTempPath()
Get-ChildItem -Path $tempDir -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Empty Recycle Bin
try {
    Clear-RecycleBin -Force -ErrorAction SilentlyContinue
} catch {}

# 4. Copy gradle-8.10.2 wrapper distribution to D:\.gradle so it doesn't need to redownload
$srcWrapper = "C:\Users\Khandaker Shanto\.gradle\wrapper"
$dstWrapper = "D:\.gradle\wrapper"
if (Test-Path $srcWrapper) {
    Copy-Item -Path $srcWrapper -Destination $dstWrapper -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Copied Gradle wrapper distribution to D:\.gradle" -ForegroundColor Green
}

# 5. Check Disk Free Space
Write-Host "`nUpdated Disk Space:" -ForegroundColor Yellow
Get-PSDrive -PSProvider FileSystem | Select-Object Root, @{Name="FreeGB";Expression={[math]::Round($_.Free / 1GB, 2)}}, @{Name="UsedGB";Expression={[math]::Round($_.Used / 1GB, 2)}}
