Get-PSDrive -PSProvider FileSystem | Select-Object Root, @{Name="FreeGB";Expression={[math]::Round($_.Free / 1GB, 2)}}, @{Name="UsedGB";Expression={[math]::Round($_.Used / 1GB, 2)}}
