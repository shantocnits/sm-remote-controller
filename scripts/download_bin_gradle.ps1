$destDir = "C:\Users\Khandaker Shanto\.gradle\wrapper\dists\gradle-8.10.2-bin\a04bxjujx95o3nb99gddekhwo"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$zipFile = Join-Path $destDir "gradle-8.10.2-bin.zip"
$okFile = Join-Path $destDir "gradle-8.10.2-bin.zip.ok"
$lckFile = Join-Path $destDir "gradle-8.10.2-bin.zip.lck"
$partFile = Join-Path $destDir "gradle-8.10.2-bin.zip.part"

# Clean any lock or partial files
if (Test-Path $lckFile) { Remove-Item $lckFile -Force }
if (Test-Path $partFile) { Remove-Item $partFile -Force }

Write-Host "Downloading gradle-8.10.2-bin.zip from GitHub CDN..." -ForegroundColor Cyan
$url = "https://github.com/gradle/gradle-distributions/releases/download/v8.10.2/gradle-8.10.2-bin.zip"

& curl.exe -L -o "$zipFile" "$url"

if (Test-Path $zipFile) {
    $size = (Get-Item $zipFile).Length
    Write-Host "Downloaded size: $size bytes" -ForegroundColor Green
    
    Write-Host "Extracting Gradle..." -ForegroundColor Cyan
    Expand-Archive -Path $zipFile -DestinationPath $destDir -Force
    
    # Touch ok file
    Set-Content -Path $okFile -Value "" -NoNewline
    Write-Host "Gradle 8.10.2 unpacked and marked OK!" -ForegroundColor Green
} else {
    Write-Host "Failed to download Gradle zip." -ForegroundColor Red
}
