# Flocon : désinstallation. Lancé par « Désinstaller Flocon.cmd » (droits administrateur).
$ErrorActionPreference = 'Continue'
$Donnees = Join-Path $env:ProgramData 'Flocon'
$Dest = Join-Path $env:ProgramFiles 'Flocon'
$config = $null
# Désinstallation sans clavier : FLOCON_REPONSES (supprimerComptes, supprimerReglages : « o » ou « n »).
$Auto = $null
if ($env:FLOCON_REPONSES) { $Auto = Get-Content $env:FLOCON_REPONSES -Raw -Encoding UTF8 | ConvertFrom-Json }
function Demander($texte, $cle) { if ($Auto) { Write-Host "  $texte : [automatique]"; return [string]$Auto.$cle } else { return (Read-Host $texte) } }
try { $config = Get-Content (Join-Path $Donnees 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json } catch { }

Write-Host ''; Write-Host '  Désinstallation de Flocon' -ForegroundColor Cyan
Unregister-ScheduledTask -TaskPath '\Flocon\' -TaskName 'Flocon Gardien' -Confirm:$false -ErrorAction SilentlyContinue
Get-ScheduledTask -TaskPath '\Flocon\' -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -like 'Flocon Session*' } | Unregister-ScheduledTask -Confirm:$false -ErrorAction SilentlyContinue
Get-Process Flocon -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force $Dest -ErrorAction SilentlyContinue
Write-Host '  [ok] Application et tâches planifiées retirées.' -ForegroundColor Green

# Version 1 : un enfant (config.enfant) ; version 2 : plusieurs (config.enfants).
$liste = @()
if ($config -and $config.enfants) { $liste = @($config.enfants) } elseif ($config -and $config.enfant) { $liste = @($config.enfant) }
foreach ($enfant in $liste) {
  if (-not $enfant.sid) { continue }
  $sid = $enfant.sid
  $profil = (Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $sid }).LocalPath
  if ($profil) {
    $charge = Test-Path "Registry::HKEY_USERS\$sid"
    $ruche = if ($charge) { "HKU\$sid" } else { reg load 'HKU\FloconEnfant' (Join-Path $profil 'NTUSER.DAT') | Out-Null; 'HKU\FloconEnfant' }
    reg delete "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /f 2>$null | Out-Null
    reg delete "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableRegistryTools /f 2>$null | Out-Null
    reg delete "$ruche\Software\Policies\Microsoft\Windows\System" /v DisableCMD /f 2>$null | Out-Null
    reg delete "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v DisallowRun /f 2>$null | Out-Null
    reg delete "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\DisallowRun" /f 2>$null | Out-Null
    foreach ($v in 'NoDesktop', 'NoControlPanel', 'NoStartMenuMorePrograms', 'TaskbarNoPinnedList', 'RestrictRun') { reg delete "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v $v /f 2>$null | Out-Null }
    reg delete "$ruche\Software\Policies\Microsoft\Edge" /f 2>$null | Out-Null
    reg delete "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\RestrictRun" /f 2>$null | Out-Null
    if (-not $charge) { [GC]::Collect(); Start-Sleep -Milliseconds 500; reg unload 'HKU\FloconEnfant' | Out-Null }
    Write-Host "  [ok] Verrous retirés pour $($enfant.prenom)." -ForegroundColor Green
  }
  $r = Demander "  Supprimer aussi le compte Windows « $($enfant.compte) » ? Ses fichiers resteront dans C:\Users. [o/N]" 'supprimerComptes'
  if ($r -match '^[oO]') { Remove-LocalUser -SID $sid; Write-Host '  [ok] Compte supprimé.' -ForegroundColor Green }
}
$r = Demander '  Supprimer la tirelire et les réglages (C:\ProgramData\Flocon) ? [o/N]' 'supprimerReglages'
if ($r -match '^[oO]') { Remove-Item -Recurse -Force $Donnees; Write-Host '  [ok] Réglages supprimés.' -ForegroundColor Green }
Remove-Item (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\Flocon.lnk') -Force -ErrorAction SilentlyContinue
Write-Host '  Ses créations (Documents, Images) ne sont jamais supprimées.'
if (-not $Auto) { Read-Host '  Entrée pour fermer' | Out-Null }
