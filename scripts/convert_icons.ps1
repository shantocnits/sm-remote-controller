Add-Type -AssemblyName System.Drawing
$rootDir = (Get-Item -Path ".").FullName
$sourcePath = Join-Path $rootDir "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
$imgBytes = [System.IO.File]::ReadAllBytes($sourcePath)
$ms = New-Object System.IO.MemoryStream(,$imgBytes)
$srcImg = [System.Drawing.Image]::FromStream($ms)

$densities = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

foreach ($key in $densities.Keys) {
    $dir = Join-Path $rootDir "android\app\src\main\res\$key"
    $size = $densities[$key]
    
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $g.Dispose()
    
    $squarePath = Join-Path $dir "ic_launcher.png"
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    
    # Save as PNG
    if (Test-Path $squarePath) { Remove-Item -Force $squarePath }
    if (Test-Path $roundPath) { Remove-Item -Force $roundPath }
    
    $bmp.Save($squarePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Host "Converted $key to $size x $size PNG"
}

$srcImg.Dispose()
$ms.Dispose()
Write-Host "All launcher icons converted to valid PNG successfully!"
