$projectRoot = Split-Path -Parent $PSScriptRoot
$basePattern = Join-Path $projectRoot "android\.gradle\*\dependencies-accessors"

Get-ChildItem -Path $basePattern -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $parent = $_.FullName
    Get-ChildItem -Path $parent -Directory | Where-Object { $_.Name -match "^([0-9a-f]{40})-" } | ForEach-Object {
        $hash = $matches[1]
        $dst = Join-Path $parent $hash
        if (-not (Test-Path $dst)) {
            Write-Host "Robocopying immutable workspace: $hash" -ForegroundColor Cyan
            & robocopy $_.FullName $dst /E /NFL /NDO /NJH /NJS | Out-Null
        }
    }
}
Write-Host "Workspace sync complete." -ForegroundColor Green
