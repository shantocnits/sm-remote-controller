$destDir = "C:\Users\Khandaker Shanto\.gradle\wrapper\dists\gradle-8.10.2-all\7iv73wktx1xtkvlq19urqw1wm"
$zipFile = Join-Path $destDir "gradle-8.10.2-all.zip"
$partFile = Join-Path $destDir "gradle-8.10.2-all.zip.part"
$lckFile = Join-Path $destDir "gradle-8.10.2-all.zip.lck"

# Remove any lock or broken partial file
if (Test-Path $lckFile) { Remove-Item $lckFile -Force }
if (Test-Path $partFile) { Remove-Item $partFile -Force }

Write-Host "Downloading gradle-8.10.2-all.zip via curl..." -ForegroundColor Cyan
$url = "https://services.gradle.org/distributions/gradle-8.10.2-all.zip"

& curl.exe -L -o "$zipFile" "$url"

if (Test-Path $zipFile) {
    $size = (Get-Item $zipFile).Length
    Write-Host "Downloaded gradle-8.10.2-all.zip ($size bytes)" -ForegroundColor Green
} else {
    Write-Host "Download failed!" -ForegroundColor Red
}
