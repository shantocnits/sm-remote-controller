$targetDir = "C:\Users\Khandaker Shanto\.gradle\wrapper\dists\gradle-8.10.2-all"
if (Test-Path $targetDir) {
    Get-ChildItem -Path $targetDir -Recurse | Select-Object FullName, Length
} else {
    Write-Host "Directory $targetDir not found"
}
