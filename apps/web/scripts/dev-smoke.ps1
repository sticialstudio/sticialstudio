$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$apiPath = Join-Path $repoRoot 'apps\api'
$webPath = Join-Path $repoRoot 'apps\web'

if (!(Test-Path $apiPath)) {
    Write-Host "API path not found: $apiPath"
    exit 1
}

if (!(Test-Path $webPath)) {
    Write-Host "Web path not found: $webPath"
    exit 1
}

$jwtSecret = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { 'dev-secret' }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { '4000' }
$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { '3000' }
$apiBaseUrl = "http://127.0.0.1:$apiPort"

$apiCommand = "Set-Location `"$apiPath`"; `$env:JWT_SECRET='$jwtSecret'; `$env:PORT='$apiPort'; npm.cmd run dev:fast"
$apiProcess = Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile', '-Command', $apiCommand -WorkingDirectory $apiPath -WindowStyle Hidden -PassThru

try {
    Set-Location $webPath
    $env:PORT = $webPort
    $env:JWT_SECRET = $jwtSecret
    $env:NEXT_PUBLIC_API_BASE_URL = $apiBaseUrl
    npm.cmd run dev:fast
}
finally {
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force
    }
}
