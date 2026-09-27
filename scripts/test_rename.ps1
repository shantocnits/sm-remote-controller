$parent = "D:\Panel\My-app\sm-remote-controller\android\.gradle\8.10.2\dependencies-accessors"
$target = Join-Path $parent "569c8b261a8a714d7731d5f568e0e5c05babae10"
$sourceDir = Get-ChildItem -Path $parent -Directory | Where-Object { $_.Name.StartsWith("569c8b261a8a714d7731d5f568e0e5c05babae10-") } | Select-Object -First 1

if ($sourceDir) {
    Write-Host "Found source: $($sourceDir.FullName)"
    try {
        Rename-Item -Path $sourceDir.FullName -NewName "569c8b261a8a714d7731d5f568e0e5c05babae10" -Force
        Write-Host "Rename succeeded!" -ForegroundColor Green
    } catch {
        Write-Host "Rename failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "No matching source found."
}
