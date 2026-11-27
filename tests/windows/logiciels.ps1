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
# Identifiants winget des logiciels pour enfants, pour corriger l'installateur s'il se trompe.
foreach ($nom in 'Tux Paint', 'TuxPaint', 'GCompris', 'RapidTyping', 'Rapid Typing') { Write-Host "--- winget search $nom"; cmd.exe /d /c "winget search `"$nom`" --source winget --accept-source-agreements 2>&1" | Out-Host }
# Ce que le paquet GCompris installe vraiment (le menu ne montre que « GCompris Teachers »).
Get-ChildItem $env:ProgramFiles, ${env:ProgramFiles(x86)} -Directory -Filter '*GCompris*' -ErrorAction SilentlyContinue | ForEach-Object { Get-ChildItem $_.FullName -Recurse -Filter *.exe -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "GCompris exe : $($_.FullName)" } }
Get-StartApps | Where-Object { $_.Name -match 'GCompris' } | ForEach-Object { Write-Host "GCompris menu : $($_.Name) = $($_.AppID)" }
# RapidTyping : s'il est dans winget, on l'installe ici pour voir où il se range (Flocon le cherche dans Program Files\RapidTyping).
$rt = cmd.exe /d /c "winget search RapidTyping --source winget --accept-source-agreements 2>&1" | Out-String
$id = ([regex]::Match($rt, '(\S*RapidTyping\S*)\s+\d')).Groups[1].Value
if ($id) {
  Write-Host "RapidTyping winget : $id"
  cmd.exe /d /c "winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity 2>&1" | Out-Host
  Get-ChildItem $env:ProgramFiles, ${env:ProgramFiles(x86)} -Recurse -Depth 3 -Filter 'RapidTyping*.exe' -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "RapidTyping exe : $($_.FullName)" }
  Get-StartApps | Where-Object { $_.Name -match 'Rapid' } | ForEach-Object { Write-Host "RapidTyping menu : $($_.Name) = $($_.AppID)" }
} else { Write-Host 'RapidTyping : absent de winget' }
$md = Join-Path $env:TEMP 'logiciels.md'
& node (Join-Path $Ici 'logiciels.js') $md
$code = $LASTEXITCODE
if ($env:GITHUB_STEP_SUMMARY) { Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value ("## Logiciels trouvés par Flocon`n`n" + (Get-Content $md -Raw -Encoding UTF8)) -Encoding UTF8 }
exit $code
