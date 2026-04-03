$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
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

if (-not $env:JWT_SECRET) {
    $env:JWT_SECRET = 'dev-secret'
}

if (-not $env:PORT) {
    $env:PORT = '4000'
}

$apiCommand = "Set-Location `"$apiPath`"; `$env:JWT_SECRET='$($env:JWT_SECRET)'; `$env:PORT='$($env:PORT)'; npm run start:stable"

Write-Host "Starting API stable mode in a new window..."
Start-Process -FilePath 'powershell' -ArgumentList '-NoExit', '-Command', $apiCommand -WorkingDirectory $apiPath

Write-Host "Building and starting web stable mode in this window..."
Set-Location $webPath
npm run start:stable
