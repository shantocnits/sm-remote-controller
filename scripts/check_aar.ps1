$files = Get-ChildItem "D:\.gradle\caches" -Recurse -File -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 10
$files | Select-Object Name, @{Name="MB";Expression={[math]::Round($_.Length / 1MB, 2)}}, LastWriteTime
