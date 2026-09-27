$files = Get-ChildItem "D:\.gradle" -Recurse -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 10
$files | Select-Object Name, Length, LastWriteTime
