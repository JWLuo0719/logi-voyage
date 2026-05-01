Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outDir = Join-Path $root "assets"
$outPath = Join-Path $outDir "hero-cyberpunk-16x9.png"

if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$width = 1920
$height = 1080
$bmp = New-Object System.Drawing.Bitmap $width, $height
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

function Color([int]$a, [int]$r, [int]$g, [int]$b) {
    return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function Brush([int]$a, [int]$r, [int]$g, [int]$b) {
    return New-Object System.Drawing.SolidBrush (Color $a $r $g $b)
}

function Pen([int]$a, [int]$r, [int]$g, [int]$b, [float]$w) {
    return New-Object System.Drawing.Pen (Color $a $r $g $b), $w
}

function FillPolygon($points, $brush) {
    $gfx.FillPolygon($brush, [System.Drawing.PointF[]]$points)
}

function DrawGlowLine([float]$x1, [float]$y1, [float]$x2, [float]$y2, [System.Drawing.Color]$color, [float]$width) {
    foreach ($scale in @(8, 5, 3)) {
        $p = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb([Math]::Max(16, [int](70 / $scale)), $color.R, $color.G, $color.B)), ($width * $scale)
        $p.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $p.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $gfx.DrawLine($p, $x1, $y1, $x2, $y2)
        $p.Dispose()
    }
    $core = New-Object System.Drawing.Pen $color, $width
    $core.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $core.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $gfx.DrawLine($core, $x1, $y1, $x2, $y2)
    $core.Dispose()
}

function FillGlowEllipse([float]$x, [float]$y, [float]$w, [float]$h, [System.Drawing.Color]$color) {
    foreach ($scale in @(2.8, 2.0, 1.35)) {
        $alpha = [int](42 / $scale)
        $brush = Brush $alpha $color.R $color.G $color.B
        $dx = ($w * $scale - $w) / 2
        $dy = ($h * $scale - $h) / 2
        $gfx.FillEllipse($brush, $x - $dx, $y - $dy, $w * $scale, $h * $scale)
        $brush.Dispose()
    }
    $core = Brush 230 $color.R $color.G $color.B
    $gfx.FillEllipse($core, $x, $y, $w, $h)
    $core.Dispose()
}

$skyRect = New-Object System.Drawing.Rectangle 0, 0, $width, $height
$skyBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $skyRect, (Color 255 6 13 33), (Color 255 8 43 71), 90
$blend = New-Object System.Drawing.Drawing2D.ColorBlend 4
$blend.Positions = [float[]]@(0, 0.42, 0.7, 1)
$blend.Colors = [System.Drawing.Color[]]@(
    (Color 255 6 10 29),
    (Color 255 11 31 58),
    (Color 255 24 57 78),
    (Color 255 239 101 41)
)
$skyBrush.InterpolationColors = $blend
$gfx.FillRectangle($skyBrush, $skyRect)
$skyBrush.Dispose()

$hazeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 0, 420, $width, 360), (Color 0 10 200 255), (Color 120 255 118 38), 0
$gfx.FillRectangle($hazeBrush, 0, 420, $width, 360)
$hazeBrush.Dispose()

$sunColor = Color 255 255 124 39
FillGlowEllipse 1340 155 220 220 $sunColor
$sunOverlay = Brush 105 5 18 43
for ($i = 0; $i -lt 9; $i++) {
    $gfx.FillRectangle($sunOverlay, 1300, 205 + ($i * 18), 300, 7)
}
$sunOverlay.Dispose()

$rng = New-Object System.Random 18
for ($i = 0; $i -lt 130; $i++) {
    $x = $rng.Next(0, $width)
    $y = $rng.Next(10, 560)
    $a = $rng.Next(42, 120)
    $b = Brush $a 112 225 255
    $gfx.FillEllipse($b, $x, $y, 2, 2)
    $b.Dispose()
}

$buildingBrush = Brush 246 4 12 28
$farBrush = Brush 210 8 24 43
$windowsBlue = Brush 165 73 226 255
$windowsOrange = Brush 165 255 137 45
$edgePenBlue = Pen 115 56 211 255 2
$edgePenOrange = Pen 110 255 118 35 2

for ($i = 0; $i -lt 28; $i++) {
    $bw = $rng.Next(54, 150)
    $bh = $rng.Next(220, 560)
    $x = $i * 72 - $rng.Next(0, 42)
    $y = 620 - $bh + $rng.Next(-20, 60)
    $brush = if ($i % 3 -eq 0) { $farBrush } else { $buildingBrush }
    $gfx.FillRectangle($brush, $x, $y, $bw, $bh)
    $edgePen = if ($i % 4 -eq 0) { $edgePenOrange } else { $edgePenBlue }
    $gfx.DrawLine($edgePen, $x, $y, $x + $bw, $y)

    for ($wx = $x + 12; $wx -lt $x + $bw - 12; $wx += 22) {
        for ($wy = $y + 24; $wy -lt 610; $wy += 32) {
            if ($rng.NextDouble() -gt 0.48) {
                $wb = if ($rng.NextDouble() -gt 0.7) { $windowsOrange } else { $windowsBlue }
                $gfx.FillRectangle($wb, $wx, $wy, 10, 3)
            }
        }
    }
}

$buildingBrush.Dispose()
$farBrush.Dispose()
$windowsBlue.Dispose()
$windowsOrange.Dispose()
$edgePenBlue.Dispose()
$edgePenOrange.Dispose()

$groundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 0, 600, $width, 480), (Color 255 7 12 25), (Color 255 19 35 46), 90
$gfx.FillRectangle($groundBrush, 0, 600, $width, 480)
$groundBrush.Dispose()

$road = @(
    [System.Drawing.PointF]::new(760, 610),
    [System.Drawing.PointF]::new(1160, 610),
    [System.Drawing.PointF]::new(1700, 1080),
    [System.Drawing.PointF]::new(220, 1080)
)
$roadBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 220, 610, 1480, 470), (Color 255 5 9 18), (Color 255 17 25 35), 90
FillPolygon $road $roadBrush
$roadBrush.Dispose()

for ($i = 0; $i -lt 18; $i++) {
    $t = $i / 17
    $y = 632 + [Math]::Pow($t, 1.85) * 445
    $left = 760 - $t * 540
    $right = 1160 + $t * 540
    $alpha = [int](120 - $t * 75)
    DrawGlowLine $left $y $right $y (Color $alpha 48 213 255) 1.2
}

for ($i = -8; $i -le 8; $i++) {
    $topX = 960 + $i * 28
    $bottomX = 960 + $i * 92
    $c = if ($i % 2 -eq 0) { Color 150 41 210 255 } else { Color 120 255 128 35 }
    DrawGlowLine $topX 612 $bottomX 1080 $c 1.4
}

DrawGlowLine 740 612 215 1080 (Color 255 34 217 255) 5
DrawGlowLine 1180 612 1698 1080 (Color 255 255 118 37) 5
DrawGlowLine 940 650 862 1080 (Color 190 255 142 44) 3
DrawGlowLine 980 650 1060 1080 (Color 190 56 219 255) 3

$carBody = @(
    [System.Drawing.PointF]::new(760, 720),
    [System.Drawing.PointF]::new(1160, 720),
    [System.Drawing.PointF]::new(1245, 790),
    [System.Drawing.PointF]::new(1168, 860),
    [System.Drawing.PointF]::new(742, 860),
    [System.Drawing.PointF]::new(675, 792)
)
$carBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 675, 700, 570, 180), (Color 255 14 23 41), (Color 255 5 8 16), 90
FillPolygon $carBody $carBrush
$carBrush.Dispose()

$glass = @(
    [System.Drawing.PointF]::new(830, 704),
    [System.Drawing.PointF]::new(1084, 704),
    [System.Drawing.PointF]::new(1144, 752),
    [System.Drawing.PointF]::new(775, 752)
)
$glassBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Rectangle 775, 690, 370, 72), (Color 210 42 225 255), (Color 125 255 127 38), 0
FillPolygon $glass $glassBrush
$glassBrush.Dispose()

DrawGlowLine 700 802 868 790 (Color 255 41 220 255) 8
DrawGlowLine 1042 790 1214 802 (Color 255 255 129 38) 8
DrawGlowLine 720 858 1205 858 (Color 190 46 219 255) 3

$shadowBrush = Brush 95 0 0 0
$gfx.FillEllipse($shadowBrush, 650, 825, 620, 120)
$shadowBrush.Dispose()

for ($i = 0; $i -lt 48; $i++) {
    $x = $rng.Next(70, 1850)
    $y = $rng.Next(605, 1040)
    $len = $rng.Next(30, 90)
    $color = if ($rng.NextDouble() -gt 0.5) { Color 95 60 220 255 } else { Color 85 255 132 42 }
    DrawGlowLine $x $y ($x + $len) ($y - 15) $color 1
}

$vignettePath = New-Object System.Drawing.Drawing2D.GraphicsPath
$vignettePath.AddRectangle((New-Object System.Drawing.Rectangle 0, 0, $width, $height))
$vignette = New-Object System.Drawing.Drawing2D.PathGradientBrush $vignettePath
$vignette.CenterColor = Color 0 0 0 0
$vignette.SurroundColors = [System.Drawing.Color[]]@(Color 175 0 0 0)
$gfx.FillRectangle($vignette, 0, 0, $width, $height)
$vignette.Dispose()
$vignettePath.Dispose()

$captionBrush = Brush 55 255 255 255
$gfx.FillRectangle($captionBrush, 112, 116, 660, 4)
$gfx.FillRectangle($captionBrush, 112, 140, 420, 2)
$captionBrush.Dispose()

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$gfx.Dispose()
$bmp.Dispose()

Write-Output $outPath
