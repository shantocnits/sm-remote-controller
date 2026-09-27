try {
    Add-MpPreference -ExclusionPath @("d:\Panel\My-app\sm-remote-controller", "C:\Users\Khandaker Shanto\.gradle") -ErrorAction Stop
    Write-Host "Successfully added Defender exclusions!" -ForegroundColor Green
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
