# Flocon : le testeur Windows. Installe, met à jour, ajoute un enfant, migre une 1.4.3, désinstalle,
# et vérifie à chaque fois ce qui doit l'être. Lancé par GitHub Actions (administrateur, Windows PowerShell 5.1).
#   scenario.ps1 -Paquet <dossier contenant Flocon\>
param([Parameter(Mandatory = $true)][string]$Paquet)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$Ici = $PSScriptRoot
$Depot = Split-Path -Parent (Split-Path -Parent $Ici)
$Installateur = Join-Path $Paquet 'Flocon\installer\installer.ps1'
$Desinstallateur = Join-Path $Paquet 'Flocon\installer\desinstaller.ps1'
$Base = Join-Path $env:ProgramData 'Flocon'
$Exe = Join-Path $env:ProgramFiles 'Flocon\Flocon.exe'
$Gardien = Join-Path $env:ProgramFiles 'Flocon\resources\app\gardien.js'
$Captures = Join-Path $Depot 'captures'
New-Item -ItemType Directory -Force -Path $Captures | Out-Null
$MotDePasse = 'Flocon-Essai-2026!'
$Resultats = New-Object System.Collections.ArrayList

function Etape($nom, [scriptblock]$bloc) {
  Write-Host ''; Write-Host "=== $nom" -ForegroundColor Cyan
  try { & $bloc; [void]$Resultats.Add([pscustomobject]@{ Etape = $nom; Ok = $true; Detail = '' }); Write-Host "  [ok] $nom" -ForegroundColor Green }
  catch { [void]$Resultats.Add([pscustomobject]@{ Etape = $nom; Ok = $false; Detail = $_.Exception.Message }); Write-Host "  [ÉCHEC] $nom : $($_.Exception.Message)" -ForegroundColor Red }
}
function Verifier { node (Join-Path $Ici 'verifier.js') @args; if ($LASTEXITCODE) { throw "le vérificateur a refusé : $($args -join ' ')" } }
function Vrai($cond, $message) { if (-not $cond) { throw $message } }

function Installer($reponses) {
  $f = Join-Path $env:TEMP ('flocon-reponses-' + [guid]::NewGuid() + '.json')
  [IO.File]::WriteAllText($f, ($reponses | ConvertTo-Json))
  $env:FLOCON_REPONSES = $f
  try { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Installateur; $code = $LASTEXITCODE } finally { Remove-Item Env:FLOCON_REPONSES; Remove-Item $f -ErrorAction SilentlyContinue }
  if ($code) { throw "l'installateur s'est arrêté (code $code)" }
}
function Taches { @(Get-ScheduledTask -TaskPath '\Flocon\' -ErrorAction SilentlyContinue | ForEach-Object { $_.TaskName }) }

# Lance droits.ps1 sous le compte d'un enfant et rend ce qu'il a pu écrire.
function DroitsDe($compte, $autre) {
  $script = 'C:\Users\Public\flocon-droits.ps1'
  $sortie = "C:\Users\Public\flocon-droits-$compte.json"
  Copy-Item (Join-Path $Ici 'droits.ps1') $script -Force
  Remove-Item $sortie -ErrorAction SilentlyContinue
  $cred = New-Object Management.Automation.PSCredential($compte, (ConvertTo-SecureString $MotDePasse -AsPlainText -Force))
  $p = Start-Process powershell.exe -Credential $cred -LoadUserProfile -WorkingDirectory 'C:\Users\Public' -WindowStyle Hidden -PassThru -Wait `
    -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $script, $compte.ToLower(), $autre, $sortie)
  Vrai (Test-Path $sortie) "le test de droits n'a rien rendu pour $compte (code $($p.ExitCode))"
  return (Get-Content $sortie -Raw | ConvertFrom-Json)
}

function Capture($nom) {
  Add-Type -AssemblyName System.Windows.Forms, System.Drawing
  $ecran = [Windows.Forms.Screen]::PrimaryScreen.Bounds
  $img = New-Object Drawing.Bitmap $ecran.Width, $ecran.Height
  $g = [Drawing.Graphics]::FromImage($img); $g.CopyFromScreen($ecran.Location, [Drawing.Point]::Empty, $ecran.Size)
  $img.Save((Join-Path $Captures "$nom.png"), [Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $img.Dispose()
}

# ---------------------------------------------------------------------------------------------
Etape 'Syntaxe des scripts PowerShell (5.1)' {
  $fautes = @()
  foreach ($f in Get-ChildItem $Depot -Recurse -Filter *.ps1 | Where-Object { $_.FullName -notmatch '\\paquet\\' }) {
    $err = $null; [void][Management.Automation.Language.Parser]::ParseFile($f.FullName, [ref]$null, [ref]$err)
    foreach ($e in $err) { $fautes += "$($f.Name) ligne $($e.Extent.StartLineNumber) : $($e.Message)" }
  }
  Vrai (-not $fautes.Count) ($fautes -join ' | ')
}

Etape 'Sessions Windows sans quser (sessions.ps1)' {
  $out = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Depot 'app\lib\sessions.ps1') liste
  Vrai ($LASTEXITCODE -eq 0) "sessions.ps1 a échoué : $out"
  Write-Host "  sessions : $out"
  $l = $out | ConvertFrom-Json
  Vrai ($null -ne $l) "sortie illisible : $out"
  Vrai (@($l | Where-Object { $_.user -eq $env:USERNAME -and $_.active }).Count -eq 1) "la session de $env:USERNAME n'est pas vue comme active"
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Depot 'app\lib\sessions.ps1') deconnecter 9999
  Vrai ($LASTEXITCODE -eq 1) "déconnecter une session inexistante devrait échouer proprement (code $LASTEXITCODE)"
}

Etape 'Installation neuve (Brune)' {
  Installer @{ pin = '1234'; prenom = 'Brune'; compte = 'Brune'; motDePasse = $MotDePasse; jetons = '8'; max = '5'; logiciels = 'n' }
  Vrai (Test-Path $Exe) 'Flocon.exe absent'
  Vrai (Test-Path (Join-Path $env:ProgramFiles 'Flocon\resources\app\lib\sessions.ps1')) 'sessions.ps1 non copié'
  Verifier neuf
  $t = Taches
  Vrai ($t -contains 'Flocon Gardien') 'tâche Gardien absente'
  Vrai ($t -contains 'Flocon Session Brune') "tâche de session absente (tâches : $($t -join ', '))"
  Vrai ((Get-LocalUser Brune).Enabled) 'compte Brune absent'
  Vrai (-not (Get-LocalGroupMember -SID 'S-1-5-32-544' | Where-Object { $_.Name -match '\\Brune$' })) 'Brune est administratrice'
}

Etape 'Le gardien tourne sous SYSTEM et tient la tirelire' {
  # On efface la tirelire neuve : c'est bien le gardien, sous SYSTEM, qui doit la réécrire.
  $f = Join-Path $Base 'enfants\brune\etat.json'
  Remove-Item $f -ErrorAction SilentlyContinue
  Start-ScheduledTask -TaskPath '\Flocon\' -TaskName 'Flocon Gardien'
  for ($i = 0; $i -lt 40 -and -not (Test-Path $f); $i++) { Start-Sleep -Seconds 3 }
  $log = Join-Path $Base 'gardien.log'
  if (Test-Path $log) { Write-Host (Get-Content $log -Raw) }
  Vrai (Test-Path $f) 'le gardien n''a pas écrit la tirelire de Brune en deux minutes'
  Verifier etat Brune
  Vrai (-not ((Get-Content $log -Raw -ErrorAction SilentlyContinue) -match 'erreur')) 'le journal du gardien contient une erreur'
}

Etape 'Le gardien lancé à la main ne plante pas' {
  # Flocon.exe est une application graphique : le « | Out-String » oblige PowerShell à attendre sa fin et son code.
  $env:ELECTRON_RUN_AS_NODE = '1'
  try { $o = & $Exe -e "process.exit(7)" | Out-String; $c = $LASTEXITCODE } finally { Remove-Item Env:ELECTRON_RUN_AS_NODE }
  Vrai ($c -eq 7) "le code de sortie de Flocon.exe n'est pas récupéré ($c) : le test ne prouverait rien"
  $env:ELECTRON_RUN_AS_NODE = '1'
  try { $out = & $Exe $Gardien | Out-String; $code = $LASTEXITCODE } finally { Remove-Item Env:ELECTRON_RUN_AS_NODE }
  Vrai ($code -eq 0) "code $code : $out"
}

Etape 'Droits de Brune (sa boîte oui, le reste non)' {
  $r = DroitsDe 'Brune' 'aucun'
  Write-Host ($r | Out-String)
  Vrai $r.saBoite 'Brune ne peut pas écrire dans sa boîte'
  Vrai $r.litConfig 'Brune ne peut pas lire la configuration'
  Vrai (-not $r.config) 'Brune peut modifier la configuration'
  Vrai (-not $r.racineBoite) 'Brune peut écrire à la racine de la boîte'
  Vrai (-not $r.sonEtat) 'Brune peut modifier sa tirelire'
}

Etape 'Ajout d''un enfant Test (Brune garde ses réglages)' {
  Verifier preparerAjout
  Installer @{ choix = '2'; prenom = 'Test'; compte = 'Test'; motDePasse = $MotDePasse; jetons = '4'; max = '2'; logiciels = 'n' }
  Verifier ajout
  $t = Taches
  Vrai (($t -contains 'Flocon Session Brune') -and ($t -contains 'Flocon Session Test')) "tâches : $($t -join ', ')"
}

Etape 'Chaque enfant n''écrit que dans sa boîte' {
  $r = DroitsDe 'Brune' 'test'
  Vrai $r.saBoite 'Brune ne peut plus écrire dans sa boîte'
  Vrai (-not $r.autreBoite) 'Brune peut écrire dans la boîte de Test'
  $r = DroitsDe 'Test' 'brune'
  Vrai $r.saBoite 'Test ne peut pas écrire dans sa boîte'
  Vrai (-not $r.autreBoite) 'Test peut écrire dans la boîte de Brune'
}

Etape 'Le robot pilote l''interface de Test (atelier, séance, sites, espace parent)' {
  & node (Join-Path $Ici 'interface.js') (Join-Path $Captures 'interface')
  $code = $LASTEXITCODE
  $md = Join-Path $Captures 'interface\interface.md'
  if (Test-Path $md) { $script:LignesInterface = Get-Content $md -Encoding UTF8 }
  Vrai ($code -eq 0) 'au moins un geste a échoué (voir le détail plus bas)'
}

Etape 'Verrous réels dans le registre de Test (niveaux 1 et 3)' {
  $sid = (Get-LocalUser Test).SID.Value
  $profil = (Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $sid }).LocalPath
  Vrai $profil 'profil de Test absent'
  $charge = Test-Path "Registry::HKEY_USERS\$sid"
  if (-not $charge) {
    # Le service des profils peut garder la ruche quelques secondes après la dernière connexion.
    for ($i = 0; $i -lt 10; $i++) { $sortie = cmd.exe /d /c "reg load HKU\$sid `"$(Join-Path $profil 'NTUSER.DAT')`" 2>&1"; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep -Seconds 3; if (Test-Path "Registry::HKEY_USERS\$sid") { $charge = $true; break } }
    Vrai (Test-Path "Registry::HKEY_USERS\$sid") "ruche de Test impossible à charger : $sortie"
  }
  try {
    $pol = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows\CurrentVersion\Policies"
    $edge = "Registry::HKEY_USERS\$sid\Software\Policies\Microsoft\Edge"
    $poser = { param($niv) $env:ELECTRON_RUN_AS_NODE = '1'; $o = & $Exe (Join-Path $Ici 'verrous.js') $Gardien $sid $niv | Out-String; $c = $LASTEXITCODE; if ($o.Trim()) { Write-Host $o }; Remove-Item Env:ELECTRON_RUN_AS_NODE; Vrai ($c -eq 0) "verrous.js : code $c" }
    $liste = { param($cle) @((Get-ItemProperty $cle).PSObject.Properties | Where-Object { $_.Name -match '^\d+$' } | ForEach-Object { $_.Value }) }
    & $poser 1
    Vrai ((Get-ItemProperty "$pol\System").DisableTaskMgr -eq 1) 'Gestionnaire des tâches non bloqué'
    Vrai ((Get-ItemProperty "$pol\System").DisableRegistryTools -eq 1) 'éditeur du registre non bloqué'
    Vrai ((Get-ItemProperty "Registry::HKEY_USERS\$sid\Software\Policies\Microsoft\Windows\System").DisableCMD -eq 1) 'invite de commandes non bloquée'
    Vrai ((Get-ItemProperty "$pol\Explorer").DisallowRun -eq 1) 'liste d''interdits inactive'
    $dr = & $liste "$pol\Explorer\DisallowRun"
    foreach ($x in 'chrome.exe', 'firefox.exe', 'msedge.exe', 'powershell.exe', 'cmd.exe', 'regedit.exe') { Vrai ($dr -contains $x) "$x non bloqué au niveau 1" }
    Vrai (-not (Test-Path $edge)) 'stratégies Edge présentes au niveau 1'
    foreach ($v in 'NoDesktop', 'NoControlPanel', 'NoStartMenuMorePrograms') { Vrai ((Get-ItemProperty "$pol\Explorer").$v -eq 1) "$v absent au niveau 1" }
    & $poser 3
    foreach ($v in 'NoDesktop', 'NoControlPanel', 'NoStartMenuMorePrograms') { Vrai ($null -eq (Get-ItemProperty "$pol\Explorer").$v) "$v resté au niveau 3" }
    $dr = & $liste "$pol\Explorer\DisallowRun"
    Vrai (-not ($dr -contains 'msedge.exe')) 'Edge encore interdit au niveau 3'
    Vrai ($dr -contains 'chrome.exe') 'Chrome autorisé au niveau 3'
    Vrai ((Get-ItemProperty "$edge\URLBlocklist").'1' -eq '*') 'Edge : tout n''est pas bloqué par défaut'
    Vrai ((& $liste "$edge\URLAllowlist") -contains 'vikidia.org') 'Edge : Vikidia absent de la liste blanche'
    Vrai ((Get-ItemProperty $edge).InPrivateModeAvailability -eq 1) 'Edge : navigation privée possible'
    Vrai ((Get-ItemProperty $edge).DownloadRestrictions -eq 3) 'Edge : téléchargements possibles'
    & $poser 1
    Vrai (-not (Test-Path $edge)) 'stratégies Edge restées après retour au niveau 1'
    Vrai ((& $liste "$pol\Explorer\DisallowRun") -contains 'msedge.exe') 'Edge pas réinterdit au retour au niveau 1'
    # La commande qu'utilise l'installateur, avec les vrais réglages de Test (niveau 4 et AmeliPro.exe, posés par le robot).
    $env:ELECTRON_RUN_AS_NODE = '1'
    try { $o = & $Exe $Gardien verrous Test | Out-String; $c = $LASTEXITCODE } finally { Remove-Item Env:ELECTRON_RUN_AS_NODE }
    Vrai ($c -eq 0) "gardien.js verrous Test : code $c $o"
    $dr = & $liste "$pol\Explorer\DisallowRun"
    Vrai ($dr -contains 'AmeliPro.exe') 'programme interdit par le parent absent'
    Vrai (-not ($dr -contains 'msedge.exe')) 'Edge interdit au niveau 4'
    Vrai ($null -eq (Get-ItemProperty "$pol\Explorer").NoDesktop) 'bureau masqué au niveau 4'
  } finally { [GC]::Collect(); Start-Sleep -Seconds 1; if (-not $charge) { reg unload "HKU\$sid" | Out-Null } }
}

Etape 'Mise à jour : rien ne change' {
  $photo = Join-Path $env:TEMP 'flocon-photo.json'
  Verifier photo $photo
  # Cas réel du 27/11 : mise à jour pendant que Flocon tourne et que le gardien est actif (Flocon.exe verrouillé).
  Enable-ScheduledTask -TaskPath '\Flocon\' -TaskName 'Flocon Gardien' | Out-Null
  $env:FLOCON_COMPTE = 'Brune'; $enCours = Start-Process $Exe -PassThru; Remove-Item Env:FLOCON_COMPTE
  Start-Sleep -Seconds 8
  Vrai (-not $enCours.HasExited) 'Flocon devait tourner avant la mise à jour'
  Installer @{ choix = '1'; logiciels = 'n' }
  Vrai (Test-Path $Exe) 'Flocon.exe absent après la mise à jour'
  $etats = @(Get-ScheduledTask -TaskPath '\Flocon\' | Where-Object { $_.State -eq 'Disabled' } | ForEach-Object { $_.TaskName })
  Vrai (-not $etats.Count) "tâches restées en pause : $($etats -join ', ')"
  Verifier maj $photo
}

Etape 'L''interface démarre et reconnaît l''enfant' {
  Remove-Item (Join-Path $Base 'boite\test\demande.json') -ErrorAction SilentlyContinue
  cmd.exe /d /c "taskkill /F /T /IM Flocon.exe /FI `"USERNAME eq $env:USERNAME`" >nul 2>&1"
  Start-Sleep -Seconds 3
  $env:FLOCON_COMPTE = 'Test'
  $p = Start-Process $Exe -PassThru
  Remove-Item Env:FLOCON_COMPTE
  Start-Sleep -Seconds 20
  try { Capture 'atelier-test' } catch { Write-Host "  (capture impossible : $($_.Exception.Message))" }
  $vivant = -not $p.HasExited
  Get-Process Flocon -ErrorAction SilentlyContinue | Stop-Process -Force
  Vrai $vivant "Flocon s'est fermé tout seul (code $($p.ExitCode))"
  Verifier interface Test
}

Etape 'Migration d''une installation 1.4.3' {
  # Le gardien est mis en pause : c'est l'installateur qui doit faire la migration ici.
  Disable-ScheduledTask -TaskPath '\Flocon\' -TaskName 'Flocon Gardien' | Out-Null
  Verifier preparerMigration
  Installer @{ choix = '1'; logiciels = 'n' }
  Verifier migration
  $t = Taches
  Vrai ($t -contains 'Flocon Session Brune') "tâches : $($t -join ', ')"
}

Etape 'Désinstallation' {
  $f = Join-Path $env:TEMP 'flocon-desinst.json'
  [IO.File]::WriteAllText($f, (@{ supprimerComptes = 'o'; supprimerReglages = 'o' } | ConvertTo-Json))
  $env:FLOCON_REPONSES = $f
  try { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Desinstallateur } finally { Remove-Item Env:FLOCON_REPONSES }
  Vrai (-not (Test-Path (Join-Path $env:ProgramFiles 'Flocon'))) 'Program Files\Flocon est resté'
  Vrai (-not (Taches).Count) "tâches restantes : $((Taches) -join ', ')"
  Vrai (-not (Test-Path $Base)) 'ProgramData\Flocon est resté'
  Vrai (-not (Get-LocalUser Brune -ErrorAction SilentlyContinue)) 'le compte Brune est resté'
}

# ---------------------------------------------------------------------------------------------
$lignes = @('## Testeur Windows de Flocon', '', '| Étape | Résultat |', '|---|---|')
foreach ($r in $Resultats) { $lignes += "| $($r.Etape) | $(if ($r.Ok) { 'ok' } else { 'ÉCHEC : ' + ($r.Detail -replace '\|', '/') }) |" }
if ($script:LignesInterface) { $lignes += $script:LignesInterface }
$texte = $lignes -join "`n"
Write-Host ''; Write-Host $texte
if ($env:GITHUB_STEP_SUMMARY) { Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value $texte -Encoding UTF8 }
if (@($Resultats | Where-Object { -not $_.Ok }).Count) { exit 1 }
