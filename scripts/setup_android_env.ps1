# Master Android & Java Environment Configuration Script for SM Controller
$javaDir = "C:\Users\Khandaker Shanto\AppData\Local\Java\jdk-17"
$androidSdkDir = "C:\Users\Khandaker Shanto\AppData\Local\Android\Sdk"
$platformTools = "$androidSdkDir\platform-tools"
$emulatorDir = "$androidSdkDir\emulator"
$javaBin = "$javaDir\bin"

Write-Output "=== 1. Configuring JAVA_HOME ==="
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaDir, "User")
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaDir, "Process")
$env:JAVA_HOME = $javaDir
Write-Output "JAVA_HOME set to: $javaDir"

Write-Output "=== 2. Configuring ANDROID_HOME & ANDROID_SDK_ROOT ==="
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkDir, "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidSdkDir, "Process")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSdkDir, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidSdkDir, "Process")
$env:ANDROID_HOME = $androidSdkDir
$env:ANDROID_SDK_ROOT = $androidSdkDir
Write-Output "ANDROID_HOME set to: $androidSdkDir"

Write-Output "=== 3. Configuring User PATH ==="
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @($javaBin, $platformTools, $emulatorDir)

foreach ($p in $pathsToAdd) {
    if ($currentPath -notlike "*$p*") {
        $currentPath = "$p;$currentPath"
        Write-Output "Added to PATH: $p"
    }
}
[Environment]::SetEnvironmentVariable("Path", $currentPath, "User")
$env:Path = "$javaBin;$platformTools;$emulatorDir;" + $env:Path

Write-Output "=== 4. Updating android/local.properties ==="
$localPropPath = "d:\Panel\My-app\sm-remote-controller\android\local.properties"
$escapedSdk = $androidSdkDir.Replace("\", "\\").Replace(":", "\:")
"sdk.dir=$escapedSdk" | Out-File -FilePath $localPropPath -Encoding ascii
Write-Output "local.properties configured with sdk.dir: $escapedSdk"

Write-Output "=== 5. Verification ==="
Write-Output "Java version:"
& "$javaBin\java.exe" -version

Write-Output "ADB version & connected devices:"
& "$platformTools\adb.exe" devices

Write-Output "`n>>> All Environment Variables configured successfully! <<<"
