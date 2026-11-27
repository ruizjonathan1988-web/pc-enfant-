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
  $env:ELECTRON_RUN_AS_NODE = '1'
  try { $out = & $Exe $Gardien; $code = $LASTEXITCODE } finally { Remove-Item Env:ELECTRON_RUN_AS_NODE }
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

Etape 'Mise à jour : rien ne change' {
  $photo = Join-Path $env:TEMP 'flocon-photo.json'
  Verifier photo $photo
  Installer @{ choix = '1'; logiciels = 'n' }
  Verifier maj $photo
}

Etape 'L''interface démarre et reconnaît l''enfant' {
  Remove-Item (Join-Path $Base 'boite\test\demande.json') -ErrorAction SilentlyContinue
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
$texte = $lignes -join "`n"
Write-Host ''; Write-Host $texte
if ($env:GITHUB_STEP_SUMMARY) { Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value $texte -Encoding UTF8 }
if (@($Resultats | Where-Object { -not $_.Ok }).Count) { exit 1 }
