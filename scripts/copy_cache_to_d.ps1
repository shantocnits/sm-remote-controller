Write-Host "Copying Gradle caches from C: to D:\.gradle..." -ForegroundColor Cyan
$src = "C:\Users\Khandaker Shanto\.gradle\caches\modules-2"
$dst = "D:\.gradle\caches\modules-2"

if (Test-Path $src) {
    Copy-Item -Path $src -Destination "D:\.gradle\caches\" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache copy complete!" -ForegroundColor Green
} else {
    Write-Host "Source cache not found"
}
