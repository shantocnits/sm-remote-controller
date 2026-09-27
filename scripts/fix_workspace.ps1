$base = "D:\Panel\My-app\sm-remote-controller\android\.gradle\8.10.2\dependencies-accessors"
$src = Join-Path $base "569c8b261a8a714d7731d5f568e0e5c05babae10-eb2b664d-5343-4305-a9f0-08a2074fff0e"
$dst = Join-Path $base "569c8b261a8a714d7731d5f568e0e5c05babae10"

if (Test-Path $src) {
    if (-not (Test-Path $dst)) {
        New-Item -ItemType Directory -Path $dst -Force | Out-Null
    }
    Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
    Write-Host "Successfully populated immutable workspace: $dst" -ForegroundColor Green
    Get-ChildItem $dst
} else {
    Write-Host "Source not found!" -ForegroundColor Red
}
