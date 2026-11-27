# Testeur des logiciels : prépare winget, installe Flocon avec les logiciels, vérifie que Flocon les trouve.
#   logiciels.ps1 -Etape winget | installer
param([Parameter(Mandatory = $true)][string]$Etape)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Ici = $PSScriptRoot
$Depot = Split-Path -Parent (Split-Path -Parent $Ici)

if ($Etape -eq 'winget') {
  if (Get-Command winget -ErrorAction SilentlyContinue) { winget --version; exit 0 }
  # Pas de winget sur cette image : le module officiel de Microsoft le répare.
  Install-PackageProvider -Name NuGet -Force | Out-Null
  Install-Module Microsoft.WinGet.Client -Force -Repository PSGallery -Scope AllUsers
  Repair-WinGetPackageManager -AllUsers -Latest
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  winget --version
  exit 0
}

# Le paquet, comme la release.
$paquet = Join-Path $env:RUNNER_TEMP 'paquet\Flocon'
New-Item -ItemType Directory -Force -Path $paquet | Out-Null
Copy-Item -Recurse (Join-Path $Depot 'app'), (Join-Path $Depot 'installer'), (Join-Path $Depot 'VERSION') -Destination $paquet
$f = Join-Path $env:TEMP 'flocon-reponses.json'
[IO.File]::WriteAllText($f, (@{ pin = '1234'; prenom = 'Brune'; compte = 'Brune'; motDePasse = 'Flocon-Essai-2026!'; jetons = '8'; max = '5'; logiciels = 'o' } | ConvertTo-Json))
$env:FLOCON_REPONSES = $f
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $paquet 'installer\installer.ps1')
$code = $LASTEXITCODE
Remove-Item Env:FLOCON_REPONSES
if ($code) { throw "l'installateur s'est arrêté (code $code)" }
$md = Join-Path $env:TEMP 'logiciels.md'
& node (Join-Path $Ici 'logiciels.js') $md
$code = $LASTEXITCODE
if ($env:GITHUB_STEP_SUMMARY) { Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value ("## Logiciels trouvés par Flocon`n`n" + (Get-Content $md -Raw -Encoding UTF8)) -Encoding UTF8 }
exit $code
