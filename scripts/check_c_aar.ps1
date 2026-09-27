$files = Get-ChildItem "C:\Users\Khandaker Shanto\.gradle\caches" -Filter "*0.76.7*" -Recurse -File -ErrorAction SilentlyContinue
$files | Select-Object FullName, Length
