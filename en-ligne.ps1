# Flocon : installation en une ligne.
#   irm https://raw.githubusercontent.com/ruizjonathan1988-web/pc-enfant-/main/en-ligne.ps1 | iex
# Télécharge l'archive, la vérifie, l'extrait et lance l'installateur avec les droits administrateur.

$ZipUrl = 'https://github.com/ruizjonathan1988-web/pc-enfant-/releases/latest/download/Flocon-installation.zip'
$ScriptUrl = 'https://raw.githubusercontent.com/ruizjonathan1988-web/pc-enfant-/main/en-ligne.ps1'

$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) {
  Write-Host 'Flocon a besoin des droits administrateur : une fenêtre va vous les demander.'
  Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"irm '$ScriptUrl' | iex`""
  return
}

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$dossier = Join-Path $env:TEMP 'flocon-source'
$zip = Join-Path $env:TEMP 'Flocon-installation.zip'
Write-Host 'Téléchargement de Flocon…'
Invoke-WebRequest -Uri $ZipUrl -OutFile $zip -UseBasicParsing
Unblock-File $zip
if (Test-Path $dossier) { Remove-Item -Recurse -Force $dossier }
Expand-Archive -Path $zip -DestinationPath $dossier -Force
Get-ChildItem $dossier -Recurse -File | Unblock-File
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dossier 'Flocon\installer\installer.ps1')
