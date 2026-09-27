# PowerShell Script to configure JDK 17, JAVA_HOME, ANDROID_HOME, and platform-tools
Write-Host "Configuring Java and Android Environment..." -ForegroundColor Cyan

# 1. Kill old adb processes
Stop-Process -Name "adb" -Force -ErrorAction SilentlyContinue

# 2. Set JAVA_HOME
$javaHome = "C:\Users\Khandaker Shanto\AppData\Local\Java\jdk-17"
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
Write-Host "[OK] JAVA_HOME set to: $javaHome" -ForegroundColor Green

# 3. Set ANDROID_HOME and ANDROID_SDK_ROOT
$androidHome = "C:\Users\Khandaker Shanto\AppData\Local\Android\Sdk"
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidHome, "User")
Write-Host "[OK] ANDROID_HOME set to: $androidHome" -ForegroundColor Green

# 4. Configure PATH
$oldUserPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$pathList = New-Object System.Collections.Generic.List[string]

# Add necessary paths first
$pathsToAdd = @(
    "$javaHome\bin",
    "$androidHome\platform-tools",
    "$androidHome\emulator"
)

foreach ($p in $pathsToAdd) {
    if (-not $pathList.Contains($p)) {
        $pathList.Add($p)
    }
}

# Append existing paths except legacy/duplicate platform-tools
foreach ($p in ($oldUserPath -split ";")) {
    $clean = $p.Trim()
    if ($clean -and -not $clean.Equals("C:\Users\Khandaker Shanto\AppData\Local\Android\platform-tools", [System.StringComparison]::OrdinalIgnoreCase)) {
        if (-not $pathList.Contains($clean)) {
            $pathList.Add($clean)
        }
    }
}

$newUserPath = $pathList -join ";"
[System.Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
Write-Host "[OK] User PATH updated successfully." -ForegroundColor Green

# 5. Verify local.properties
$localPropsPath = "d:\Panel\My-app\sm-remote-controller\android\local.properties"
$localPropsContent = "sdk.dir=C\:\\Users\\Khandaker Shanto\\AppData\\Local\\Android\\Sdk`n"
Set-Content -Path $localPropsPath -Value $localPropsContent -Encoding ASCII
Write-Host "[OK] android/local.properties configured." -ForegroundColor Green

# 6. Verify and output
Write-Host "`n--- Verification ---" -ForegroundColor Yellow
& "$javaHome\bin\java.exe" -version
& "$androidHome\platform-tools\adb.exe" devices

Write-Host "`nEnvironment setup is complete!" -ForegroundColor Green
