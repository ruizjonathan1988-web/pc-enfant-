# Flocon : installation clé en main sur l'ordinateur familial (Windows 10 ou 11).
# Lancé par « Installer Flocon.cmd », qui demande les droits administrateur.

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$VersionElectron = '45.5.0'
$Racine = Split-Path -Parent $PSScriptRoot
$SourceApp = Join-Path $Racine 'app'
$Dest = Join-Path $env:ProgramFiles 'Flocon'
$Donnees = Join-Path $env:ProgramData 'Flocon'
$Journal = Join-Path $env:TEMP 'flocon-installation.log'
Start-Transcript -Path $Journal -Append | Out-Null

function Titre($t) { Write-Host ''; Write-Host "  $t" -ForegroundColor Cyan; Write-Host ('  ' + ('-' * $t.Length)) -ForegroundColor DarkCyan }
function Ok($t) { Write-Host "  [ok] $t" -ForegroundColor Green }
function Info($t) { Write-Host "  $t" }
function Attention($t) { Write-Host "  [!] $t" -ForegroundColor Yellow }

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { Write-Host 'Il faut lancer « Installer Flocon.cmd » (droits administrateur).' -ForegroundColor Red; Read-Host 'Entrée pour fermer'; exit 1 }
if (-not (Test-Path (Join-Path $SourceApp 'main.js'))) { Write-Host "Dossier app introuvable à côté de l'installateur." -ForegroundColor Red; Read-Host 'Entrée pour fermer'; exit 1 }

Clear-Host
Write-Host ''
Write-Host '   Flocon  ·  un ordinateur qui apprend à s''en passer' -ForegroundColor White
Write-Host '   Installation : une dizaine de minutes, surtout des téléchargements.' -ForegroundColor Gray

# ------------------------------------------------------------------ questions
Titre '1. Quelques questions'
$prenom = ''
while (-not $prenom.Trim()) { $prenom = Read-Host '  Prénom de votre enfant' }
$prenom = $prenom.Trim()
$compteDefaut = ($prenom.Normalize([Text.NormalizationForm]::FormD) -replace '\p{Mn}', '' -replace '[^A-Za-z0-9]', '')
if (-not $compteDefaut) { $compteDefaut = 'Enfant' }
$compte = Read-Host "  Nom du compte Windows à créer ou utiliser [$compteDefaut]"
if (-not $compte.Trim()) { $compte = $compteDefaut }
$compte = $compte.Trim()

$pin = ''
while ($true) {
  $s1 = Read-Host '  Code parent (4 chiffres, pour le temps à deux et les réglages)' -AsSecureString
  $p1 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s1))
  if ($p1 -notmatch '^\d{4}$') { Attention 'Quatre chiffres, s''il vous plaît.'; continue }
  $s2 = Read-Host '  Le même code, encore une fois' -AsSecureString
  $p2 = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s2))
  if ($p1 -ne $p2) { Attention 'Les deux codes ne sont pas identiques.'; continue }
  $pin = $p1; break
}
$jetons = Read-Host '  Jetons de 15 minutes par semaine [8 = 2 h]'
if ($jetons -notmatch '^\d+$') { $jetons = 8 } else { $jetons = [int]$jetons }
$max = Read-Host '  Maximum de jetons par séance [5 = 1 h 15]'
if ($max -notmatch '^\d+$') { $max = 5 } else { $max = [int]$max }
$avecLogiciels = Read-Host '  Installer aussi les logiciels (Scratch, Krita, LibreOffice, Audacity, Steam, Minecraft, Klavaro) ? [O/n]'
$avecLogiciels = -not ($avecLogiciels -match '^[nN]')

# ------------------------------------------------------------------ compte enfant
Titre '2. Le compte de votre enfant'
$utilisateur = Get-LocalUser -Name $compte -ErrorAction SilentlyContinue
if (-not $utilisateur) {
  Info "Création du compte local « $compte » (compte standard, sans droits d'administration)."
  $mdp = Read-Host "  Mot de passe pour ce compte (laisser vide = aucun mot de passe)" -AsSecureString
  if ($mdp.Length -gt 0) { $utilisateur = New-LocalUser -Name $compte -FullName $prenom -Password $mdp -PasswordNeverExpires -UserMayNotChangePassword -Description 'Compte enfant Flocon' }
  else { $utilisateur = New-LocalUser -Name $compte -FullName $prenom -NoPassword -Description 'Compte enfant Flocon'; Set-LocalUser -Name $compte -PasswordNeverExpires $true }
  Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $compte -ErrorAction SilentlyContinue
  Ok "Compte « $compte » créé."
} else {
  Ok "Le compte « $compte » existe déjà : je l'utilise."
}
$estAdmin = Get-LocalGroupMember -SID 'S-1-5-32-544' -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "\\$([regex]::Escape($compte))$" }
if ($estAdmin) {
  Remove-LocalGroupMember -SID 'S-1-5-32-544' -Member $compte
  Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $compte -ErrorAction SilentlyContinue
  Ok 'Ce compte était administrateur : il est repassé en compte standard.'
}
$sid = (Get-LocalUser -Name $compte).SID.Value

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
$sommes = (Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -UseBasicParsing).Content
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

# ------------------------------------------------------------------ données et droits
Titre '5. Tirelire et réglages'
New-Item -ItemType Directory -Force -Path $Donnees | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Donnees 'boite') | Out-Null
$configChemin = Join-Path $Donnees 'config.json'
$sel = -join ((1..16) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
$sha = [Security.Cryptography.SHA256]::Create()
$hash = -join ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes("$($sel):$pin")) | ForEach-Object { $_.ToString('x2') })
$ancien = $null
if (Test-Path $configChemin) { try { $ancien = Get-Content $configChemin -Raw -Encoding UTF8 | ConvertFrom-Json } catch { $ancien = $null } }
$config = [ordered]@{
  version = 1
  enfant = [ordered]@{ prenom = $prenom; compte = $compte; sid = $sid }
  jetonsSemaine = $jetons
  maxParSeance = $max
  aDeuxMaxMinutes = 120
  graceMinutes = 5
  pinSel = $sel
  pinHash = $hash
  sites = $(if ($ancien) { $ancien.sites } else { $null })
  jeux = $(if ($ancien -and $ancien.jeux) { @($ancien.jeux) } else { @() })
  logiciels = $null
}
$json = $config | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($configChemin, $json, (New-Object Text.UTF8Encoding($false)))
# Droits : SYSTEM et administrateurs écrivent, les utilisateurs lisent seulement ; la boîte aux lettres est modifiable.
icacls $Donnees /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' '*S-1-5-32-545:(OI)(CI)RX' | Out-Null
icacls (Join-Path $Donnees 'boite') /grant '*S-1-5-32-545:(OI)(CI)M' | Out-Null
Ok "Tirelire : $jetons jetons par semaine, $max maximum par séance."

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
$xmlSession = @"
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
Register-ScheduledTask -TaskName 'Flocon Gardien' -TaskPath '\Flocon\' -Xml $xmlGardien -Force | Out-Null
Register-ScheduledTask -TaskName 'Flocon Session' -TaskPath '\Flocon\' -Xml $xmlSession -Force | Out-Null
Start-ScheduledTask -TaskPath '\Flocon\' -TaskName 'Flocon Gardien'
Ok 'Gardien installé (compte SYSTEM, chaque minute).'
Ok "Lancement automatique installé pour « $compte »."

# ------------------------------------------------------------------ verrous du compte enfant (si son profil existe déjà)
$profil = (Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $sid }).LocalPath
if ($profil -and (Test-Path (Join-Path $profil 'NTUSER.DAT'))) {
  $charge = Test-Path "Registry::HKEY_USERS\$sid"
  $ruche = if ($charge) { "HKU\$sid" } else { reg load 'HKU\FloconEnfant' (Join-Path $profil 'NTUSER.DAT') | Out-Null; 'HKU\FloconEnfant' }
  reg add "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f | Out-Null
  reg add "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableRegistryTools /t REG_DWORD /d 1 /f | Out-Null
  reg add "$ruche\Software\Policies\Microsoft\Windows\System" /v DisableCMD /t REG_DWORD /d 1 /f | Out-Null
  reg add "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v DisallowRun /t REG_DWORD /d 1 /f | Out-Null
  $i = 1; foreach ($x in 'powershell.exe','pwsh.exe','powershell_ise.exe','wt.exe','cmd.exe','regedit.exe','taskmgr.exe','mmc.exe','msedge.exe','chrome.exe','firefox.exe','brave.exe','opera.exe','Minecraft.Windows.exe') { reg add "$ruche\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\DisallowRun" /v $i /t REG_SZ /d $x /f | Out-Null; $i++ }
  if (-not $charge) { [GC]::Collect(); Start-Sleep -Milliseconds 500; reg unload 'HKU\FloconEnfant' | Out-Null }
  Ok 'Verrous posés sur sa session (Gestionnaire des tâches, invite de commandes, navigateurs).'
} else {
  Info 'Sa session n''a jamais été ouverte : le gardien posera les verrous à sa première connexion.'
}

Titre 'C''est installé'
Info "Prochaine étape : fermez votre session et ouvrez celle de $prenom, avec elle ou lui."
Info 'L''atelier de première connexion démarre tout seul ; le pacte se signe ensemble avec votre code.'
Info "Notice complète : LISEZMOI.html, à côté de l'installateur. Journal : $Journal"
Stop-Transcript | Out-Null
Read-Host '  Entrée pour fermer'
