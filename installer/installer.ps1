# Flocon : installation clé en main sur l'ordinateur familial (Windows 10 ou 11).
# Lancé par « Installer Flocon.cmd », qui demande les droits administrateur.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
# Windows PowerShell 5.1 écrit parfois une liste en {"value":[…],"Count":n} : on l'en empêche.
Remove-TypeData System.Array -ErrorAction SilentlyContinue
$VersionElectron = '45.5.0'
$Racine = Split-Path -Parent $PSScriptRoot
$SourceApp = Join-Path $Racine 'app'
$Dest = Join-Path $env:ProgramFiles 'Flocon'
$Donnees = Join-Path $env:ProgramData 'Flocon'
$Journal = Join-Path $env:TEMP 'flocon-installation.log'
Start-Transcript -Path $Journal -Append | Out-Null

# Installation sans clavier : FLOCON_REPONSES désigne un fichier JSON de réponses
# (choix, pin, prenom, compte, motDePasse, jetons, max, logiciels). Sert aux tests automatiques et aux installations en série.
$Auto = $null
if ($env:FLOCON_REPONSES) { $Auto = Get-Content $env:FLOCON_REPONSES -Raw -Encoding UTF8 | ConvertFrom-Json }
function Demander($texte, $cle, [switch]$Secret) {
  if ($Auto) {
    $v = if ($null -ne $Auto.$cle) { [string]$Auto.$cle } else { '' }
    Write-Host "  $texte : [automatique]"
    if ($Secret) { if ($v) { return (ConvertTo-SecureString $v -AsPlainText -Force) } else { return (New-Object Security.SecureString) } }
    return $v
  }
  if ($Secret) { return (Read-Host $texte -AsSecureString) }
  return (Read-Host $texte)
}
function Pause { if (-not $Auto) { Read-Host '  Entrée pour fermer' | Out-Null } }
function Refus($t) { if ($Auto) { throw "Réponse automatique refusée : $t" } else { Attention $t } }

function Titre($t) { Write-Host ''; Write-Host "  $t" -ForegroundColor Cyan; Write-Host ('  ' + ('-' * $t.Length)) -ForegroundColor DarkCyan }
function Ok($t) { Write-Host "  [ok] $t" -ForegroundColor Green }
function Info($t) { Write-Host "  $t" }
function Attention($t) { Write-Host "  [!] $t" -ForegroundColor Yellow }

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { Write-Host 'Il faut lancer « Installer Flocon.cmd » (droits administrateur).' -ForegroundColor Red; Pause; exit 1 }
if (-not (Test-Path (Join-Path $SourceApp 'main.js'))) { Write-Host "Dossier app introuvable à côté de l'installateur." -ForegroundColor Red; Pause; exit 1 }

Clear-Host
Write-Host ''
Write-Host '   Flocon  ·  un ordinateur qui apprend à s''en passer' -ForegroundColor White
Write-Host '   Installation : une dizaine de minutes, surtout des téléchargements.' -ForegroundColor Gray

# ------------------------------------------------------------------ outils
# Nom de dossier d'un compte : identique à dossierCompte() dans app/lib/enfants.js.
function DossierCompte($c) { $s = ([string]$c).ToLower().Normalize([Text.NormalizationForm]::FormD) -replace '\p{Mn}', '' -replace '[^a-z0-9._-]', '_'; if (-not $s) { 'enfant' } else { $s } }

# Un enfant lu dans config.json, remis en table ordonnée (les listes restent des listes, même d'un seul élément).
function EnfantDepuis($o, $racine) {
  $src = if ($racine) { $racine } else { $o }
  $h = [ordered]@{
    compte = [string]$o.compte; prenom = [string]$o.prenom; sid = $o.sid
    jetonsSemaine = $(if ($null -ne $src.jetonsSemaine) { [int]$src.jetonsSemaine } else { 8 })
    maxParSeance = $(if ($null -ne $src.maxParSeance) { [int]$src.maxParSeance } else { 5 })
    niveau = $(if ($null -ne $src.niveau) { [int]$src.niveau } else { 1 })
  }
  if ($null -ne $src.sites) { $h.sites = @($src.sites) } else { $h.sites = $null }
  if ($src.jeux) { $h.jeux = @($src.jeux) } else { $h.jeux = @() }
  $h.logiciels = $src.logiciels
  return $h
}

# Questions pour un nouvel enfant, création de son compte Windows si besoin.
function DemanderEnfant($existants) {
  $prenom = ''
  while (-not $prenom.Trim()) { $prenom = Demander '  Prénom de l''enfant (ou « Test » pour un compte d''essai)' 'prenom' }
  $prenom = $prenom.Trim()
  $defaut = ($prenom.Normalize([Text.NormalizationForm]::FormD) -replace '\p{Mn}', '' -replace '[^A-Za-z0-9]', '')
  if (-not $defaut) { $defaut = 'Enfant' }
  while ($true) {
    $compte = Demander "  Nom du compte Windows à créer ou utiliser [$defaut]" 'compte'
    if (-not $compte.Trim()) { $compte = $defaut }
    $compte = $compte.Trim()
    if (@($existants | Where-Object { $_.compte -eq $compte }).Count) { Refus "« $compte » est déjà un enfant de Flocon."; continue }
    break
  }
  $j = Demander '  Jetons de 15 minutes par semaine [8 = 2 h]' 'jetons'
  $j = if ($j -match '^\d+$') { [int]$j } else { 8 }
  $m = Demander '  Maximum de jetons par séance [5 = 1 h 15]' 'max'
  $m = if ($m -match '^\d+$') { [int]$m } else { 5 }
  if (-not (Get-LocalUser -Name $compte -ErrorAction SilentlyContinue)) {
    Info "Création du compte local « $compte » (compte standard, sans droits d'administration)."
    $mdp = Demander "  Mot de passe pour ce compte (laisser vide = aucun mot de passe)" 'motDePasse' -Secret
    if ($mdp.Length -gt 0) { New-LocalUser -Name $compte -FullName $prenom -Password $mdp -PasswordNeverExpires -UserMayNotChangePassword -Description 'Compte enfant Flocon' | Out-Null }
    else { New-LocalUser -Name $compte -FullName $prenom -NoPassword -Description 'Compte enfant Flocon' | Out-Null; Set-LocalUser -Name $compte -PasswordNeverExpires $true }
    Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $compte -ErrorAction SilentlyContinue
    Ok "Compte « $compte » créé."
  } else { Ok "Le compte « $compte » existe déjà : je l'utilise." }
  return [ordered]@{ compte = $compte; prenom = $prenom; sid = $null; jetonsSemaine = $j; maxParSeance = $m; niveau = 1; sites = $null; jeux = @(); logiciels = $null }
}

# ------------------------------------------------------------------ installation existante ?
$configChemin = Join-Path $Donnees 'config.json'
$ancien = $null
if (Test-Path $configChemin) { try { $ancien = Get-Content $configChemin -Raw -Encoding UTF8 | ConvertFrom-Json } catch { $ancien = $null } }
$enfants = New-Object System.Collections.ArrayList
if ($ancien -and $ancien.pinHash) {
  if ($ancien.enfants) { foreach ($o in @($ancien.enfants)) { [void]$enfants.Add((EnfantDepuis $o $null)) } }
  elseif ($ancien.enfant -and $ancien.enfant.compte) { [void]$enfants.Add((EnfantDepuis $ancien.enfant $ancien)) }   # installation 1.4.x, un seul enfant
}
$mode = 'neuf'
if ($enfants.Count) {
  Titre 'Flocon est déjà installé'
  foreach ($e in $enfants) { Info "$($e.prenom) (compte « $($e.compte) ») : permis niveau $($e.niveau), $($e.jetonsSemaine) jetons par semaine." }
  Write-Host ''
  Info '1. Mettre à jour Flocon : rien ne change pour les enfants (code, jetons, niveau, sites, jeux, tirelire).'
  Info '2. Ajouter un enfant, par exemple un compte Test.'
  Info '3. Tout recommencer : nouveau code, un seul enfant, réglages remis à zéro.'
  $r = Demander '  Votre choix [1]' 'choix'
  $mode = switch ($r.Trim()) { '2' { 'ajout' } '3' { 'neuf' } default { 'maj' } }
}

# ------------------------------------------------------------------ questions
if ($mode -eq 'neuf') {
  Titre '1. Quelques questions'
  $pin = ''
  while ($true) {
    $s1 = Demander '  Code parent (4 chiffres, pour le temps à deux et les réglages)' 'pin' -Secret
    $p1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s1))
    if ($p1 -notmatch '^\d{4}$') { Refus 'Quatre chiffres, s''il vous plaît.'; continue }
    $s2 = Demander '  Le même code, encore une fois' 'pin' -Secret
    $p2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s2))
    if ($p1 -ne $p2) { Attention 'Les deux codes ne sont pas identiques.'; continue }
    $pin = $p1; break
  }
  $sel = -join ((1..16) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
  $sha = [Security.Cryptography.SHA256]::Create()
  $pinSel = $sel
  $pinHash = -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes("$($sel):$pin")) | ForEach-Object { $_.ToString('x2') })
  $aDeuxMax = 120; $grace = 5
  $enfants.Clear()
  Titre '2. Votre enfant'
  [void]$enfants.Add((DemanderEnfant $enfants))
  $r = Demander '  Installer aussi les logiciels (Scratch, Krita, LibreOffice, Audacity, Steam, Minecraft, Klavaro) ? [O/n]' 'logiciels'
  $avecLogiciels = -not ($r -match '^[nN]')
} else {
  $pinSel = $ancien.pinSel; $pinHash = $ancien.pinHash
  $aDeuxMax = $(if ($ancien.aDeuxMaxMinutes) { [int]$ancien.aDeuxMaxMinutes } else { 120 })
  $grace = $(if ($ancien.graceMinutes) { [int]$ancien.graceMinutes } else { 5 })
  if ($mode -eq 'ajout') { Titre '2. Le nouvel enfant'; [void]$enfants.Add((DemanderEnfant $enfants)) }
  $r = Demander '  Vérifier aussi les logiciels (installe ceux qui manquent, plus long) ? [o/N]' 'logiciels'
  $avecLogiciels = $r -match '^[oO]'
}

# ------------------------------------------------------------------ comptes des enfants
Titre 'Les comptes des enfants'
foreach ($e in $enfants) {
  $u = Get-LocalUser -Name $e.compte -ErrorAction SilentlyContinue
  if (-not $u) { $e.sid = $null; Attention "Le compte « $($e.compte) » n'existe plus : Flocon l'ignore tant qu'il n'est pas recréé."; continue }
  $estAdmin = Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "\\$([regex]::Escape($e.compte))$" }
  if ($estAdmin) {
    Remove-LocalGroupMember -SID 'S-1-5-32-544' -Member $e.compte
    Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $e.compte -ErrorAction SilentlyContinue
    Ok "« $($e.compte) » était administrateur : il est repassé en compte standard."
  }
  $e.sid = $u.SID.Value
  Ok "$($e.prenom) : compte « $($e.compte) »."
}

# ------------------------------------------------------------------ logiciels
if ($avecLogiciels) {
  Titre '3. Les logiciels (via winget)'
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    Attention "winget est absent. Installez « App Installer » depuis le Microsoft Store, puis relancez l'installation. Je continue sans les logiciels."
  } else {
    $paquets = @(
      @{ id = 'MITMediaLab.Scratch.3'; nom = 'Scratch' },
      @{ id = 'KDE.Krita'; nom = 'Krita' },
      @{ id = 'TheDocumentFoundation.LibreOffice'; nom = 'LibreOffice' },
      @{ id = 'Audacity.Audacity'; nom = 'Audacity' },
      @{ id = 'Valve.Steam'; nom = 'Steam' },
      @{ id = 'Mojang.MinecraftLauncher'; nom = 'Minecraft Launcher' },
      @{ id = 'FelipeEFdeCastro.Klavaro'; nom = 'Klavaro (clavier)' }
    )
    foreach ($p in $paquets) {
      Info "Installation de $($p.nom)…"
      $deja = winget list --id $p.id -e --accept-source-agreements 2>$null | Select-String -SimpleMatch $p.id
      if ($deja) { Ok "$($p.nom) déjà installé."; continue }
      winget install --id $p.id -e --silent --scope machine --accept-package-agreements --accept-source-agreements --disable-interactivity | Out-Null
      if ($LASTEXITCODE -ne 0) { winget install --id $p.id -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity | Out-Null }
      if ($LASTEXITCODE -eq 0) { Ok "$($p.nom) installé." } else { Attention "$($p.nom) : échec (code $LASTEXITCODE). Vous pourrez l'installer plus tard." }
    }
    Info 'Stop Motion Studio vient du Microsoft Store : il s''installe par compte. Voir la notice, étape « Stop Motion Studio ».'
  }
}

# ------------------------------------------------------------------ Electron + application
Titre '4. L''application Flocon'
$tmp = Join-Path $env:TEMP "flocon-$VersionElectron"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$zip = Join-Path $tmp "electron-v$VersionElectron-win32-x64.zip"
$base = "https://github.com/electron/electron/releases/download/v$VersionElectron"
if (-not (Test-Path $zip)) {
  Info "Téléchargement du moteur (environ 150 Mo)…"
  Invoke-WebRequest -Uri "$base/electron-v$VersionElectron-win32-x64.zip" -OutFile $zip -UseBasicParsing
}
Info 'Vérification de l''empreinte du téléchargement…'
# GitHub sert ce fichier en application/octet-stream : on l'enregistre puis on le relit comme texte.
$fichierSommes = Join-Path $tmp 'SHASUMS256.txt'
Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -OutFile $fichierSommes -UseBasicParsing
$sommes = Get-Content -Path $fichierSommes -Raw -Encoding UTF8
$attendu = ($sommes -split "`n" | Where-Object { $_ -match "electron-v$VersionElectron-win32-x64\.zip" } | Select-Object -First 1) -replace '\s.*$', ''
$obtenu = (Get-FileHash -Algorithm SHA256 $zip).Hash.ToLower()
if (-not $attendu -or $attendu.Trim().ToLower() -ne $obtenu) { Remove-Item $zip -Force; throw "Empreinte incorrecte : le téléchargement est corrompu. Relancez l'installation." }
Ok 'Téléchargement vérifié.'

Get-Process Flocon -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
$tar = Get-Command tar.exe -ErrorAction SilentlyContinue
if ($tar) { & $tar.Source -xf $zip -C $Dest } else { Expand-Archive -Path $zip -DestinationPath $Dest -Force }
if (-not (Test-Path (Join-Path $Dest 'electron.exe'))) { throw "Extraction du moteur incomplète." }
Rename-Item (Join-Path $Dest 'electron.exe') 'Flocon.exe'
Remove-Item (Join-Path $Dest 'resources\default_app.asar') -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force $SourceApp (Join-Path $Dest 'resources\app')
Ok "Flocon installé dans $Dest"
# Raccourci « Flocon » du menu Démarrer : au niveau 4 du permis, elle peut fermer Flocon et le rouvrir elle-même.
$lnk = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\Flocon.lnk'
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($lnk); $sc.TargetPath = (Join-Path $Dest 'Flocon.exe'); $sc.Arguments = '--ouvrir'; $sc.WorkingDirectory = $Dest; $sc.Save()
Ok 'Raccourci Flocon ajouté au menu Démarrer.'

# ------------------------------------------------------------------ données et droits
Titre '5. Tirelires et réglages'
New-Item -ItemType Directory -Force -Path (Join-Path $Donnees 'boite') | Out-Null
$config = [ordered]@{ version = 2; pinSel = $pinSel; pinHash = $pinHash; aDeuxMaxMinutes = $aDeuxMax; graceMinutes = $grace; enfants = @($enfants) }
[IO.File]::WriteAllText($configChemin, ($config | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding($false)))
# Tirelire d'une installation 1.4.x : elle devient celle du premier enfant.
$ancienEtat = Join-Path $Donnees 'etat.json'
$etatPremier = Join-Path $Donnees ('enfants\' + (DossierCompte $enfants[0].compte) + '\etat.json')
if ($mode -eq 'neuf') { Remove-Item -Recurse -Force (Join-Path $Donnees 'enfants') -ErrorAction SilentlyContinue; Remove-Item $ancienEtat -Force -ErrorAction SilentlyContinue }
elseif ((Test-Path $ancienEtat) -and -not (Test-Path $etatPremier)) { New-Item -ItemType Directory -Force -Path (Split-Path $etatPremier) | Out-Null; Move-Item $ancienEtat $etatPremier }
Remove-Item (Join-Path $Donnees 'boite\demande.json'), (Join-Path $Donnees 'boite\parent.json') -Force -ErrorAction SilentlyContinue
# Droits : SYSTEM et administrateurs écrivent, les utilisateurs lisent seulement.
# Chaque enfant n'écrit que dans sa propre boîte aux lettres (boite\<compte>).
icacls $Donnees /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-32-545:(OI)(CI)RX' | Out-Null
icacls (Join-Path $Donnees 'boite') /remove:g '*S-1-5-32-545' | Out-Null
foreach ($e in $enfants) {
  if (-not $e.sid) { continue }
  $d = DossierCompte $e.compte
  New-Item -ItemType Directory -Force -Path (Join-Path $Donnees "enfants\$d") | Out-Null
  $b = Join-Path $Donnees "boite\$d"
  New-Item -ItemType Directory -Force -Path $b | Out-Null
  icacls $b /grant "*$($e.sid):(OI)(CI)M" | Out-Null
}
if ($mode -eq 'maj') { Ok 'Réglages et tirelires conservés.' } else { foreach ($e in $enfants) { Ok "$($e.prenom) : $($e.jetonsSemaine) jetons par semaine, $($e.maxParSeance) maximum par séance." } }

# ------------------------------------------------------------------ tâches planifiées
Titre '6. Le gardien et le lancement automatique'
$exe = Join-Path $Dest 'Flocon.exe'
$gardien = Join-Path $Dest 'resources\app\gardien.js'
$debut = (Get-Date).AddMinutes(1).ToString('yyyy-MM-ddTHH:mm:ss')
$xmlGardien = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Flocon : compte le temps de la séance et tient la tirelire. Tourne chaque minute.</Description></RegistrationInfo>
  <Triggers>
    <BootTrigger><Enabled>true</Enabled><Repetition><Interval>PT1M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition></BootTrigger>
    <TimeTrigger><StartBoundary>$debut</StartBoundary><Enabled>true</Enabled><Repetition><Interval>PT1M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition></TimeTrigger>
  </Triggers>
  <Principals><Principal id="Systeme"><UserId>S-1-5-18</UserId><RunLevel>HighestAvailable</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable><ExecutionTimeLimit>PT2M</ExecutionTimeLimit><Hidden>true</Hidden>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
  </Settings>
  <Actions Context="Systeme"><Exec><Command>cmd.exe</Command><Arguments>/d /c "set ELECTRON_RUN_AS_NODE=1&amp;&amp; "$exe" "$gardien""</Arguments></Exec></Actions>
</Task>
"@
function XmlSession($sid) {
@"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>Flocon : ouvre l'accueil à la connexion et le relance s'il est fermé.</Description></RegistrationInfo>
  <Triggers>
    <LogonTrigger><Enabled>true</Enabled><UserId>$sid</UserId><Repetition><Interval>PT1M</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition></LogonTrigger>
  </Triggers>
  <Principals><Principal id="Enfant"><UserId>$sid</UserId><LogonType>InteractiveToken</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries><StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable><ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
  </Settings>
  <Actions Context="Enfant"><Exec><Command>$exe</Command></Exec></Actions>
</Task>
"@
}
Register-ScheduledTask -TaskName 'Flocon Gardien' -TaskPath '\Flocon\' -Xml $xmlGardien -Force | Out-Null
# Une tâche « Flocon Session » par enfant ; celles des versions précédentes ou d'enfants retirés sont effacées.
Get-ScheduledTask -TaskPath '\Flocon\' -ErrorAction SilentlyContinue | Where-Object { $_.TaskName -like 'Flocon Session*' } | Unregister-ScheduledTask -Confirm:$false
foreach ($e in $enfants) {
  if (-not $e.sid) { continue }
  Register-ScheduledTask -TaskName "Flocon Session $($e.compte)" -TaskPath '\Flocon\' -Xml (XmlSession $e.sid) -Force | Out-Null
  Ok "Lancement automatique installé pour « $($e.compte) »."
}
Start-ScheduledTask -TaskPath '\Flocon\' -TaskName 'Flocon Gardien'
Ok 'Gardien installé (compte SYSTEM, chaque minute).'

# ------------------------------------------------------------------ verrous des comptes enfants (si leur profil existe déjà)
# C'est le gardien qui les pose, selon le niveau de chaque enfant : une seule liste, celle de app\gardien.js.
foreach ($e in $enfants) {
  $sid = $e.sid
  if (-not $sid) { continue }
  $profil = (Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $sid }).LocalPath
  if ($profil -and (Test-Path (Join-Path $profil 'NTUSER.DAT'))) {
    $charge = Test-Path "Registry::HKEY_USERS\$sid"
    if (-not $charge) { cmd.exe /d /c "reg load HKU\$sid `"$(Join-Path $profil 'NTUSER.DAT')`" >nul 2>&1" }
    if (Test-Path "Registry::HKEY_USERS\$sid") {
      $env:ELECTRON_RUN_AS_NODE = '1'
      # Flocon.exe est une application graphique : le pipeline oblige PowerShell à attendre la fin.
      try { & $exe $gardien verrous $e.compte | Out-String | Out-Null; $code = $LASTEXITCODE } finally { Remove-Item Env:ELECTRON_RUN_AS_NODE }
      if (-not $charge) { [GC]::Collect(); Start-Sleep -Milliseconds 500; cmd.exe /d /c "reg unload HKU\$sid >nul 2>&1" }
      if ($code -eq 0) { Ok "$($e.prenom) : verrous posés pour le niveau $($e.niveau)." } else { Attention "$($e.prenom) : verrous non posés (code $code), le gardien s'en chargera à sa connexion." }
    } else { Info "$($e.prenom) : sa session est ouverte ailleurs, le gardien posera les verrous." }
  } else {
    Info "$($e.prenom) : session jamais ouverte, le gardien posera les verrous à la première connexion."
  }
}

$version = Get-Content (Join-Path $Racine 'VERSION') -ErrorAction SilentlyContinue
if ($mode -eq 'maj') {
  Titre 'C''est à jour'
  Info "Flocon est passé en version $version. Rien n'a changé pour les enfants : réglages, tirelires et créations sont intacts."
} else {
  $nouveau = $enfants[$enfants.Count - 1]
  Titre 'C''est installé'
  Info "Prochaine étape : fermez votre session et ouvrez celle de « $($nouveau.compte) »."
  Info 'L''atelier de première connexion démarre tout seul ; le pacte se signe à la fin avec votre code.'
}
Info "Notice complète : LISEZMOI.html, à côté de l'installateur. Journal : $Journal"
Stop-Transcript | Out-Null
Pause
