# Lancé sous le compte d'un enfant : ce qu'il peut écrire, et ce qu'il ne doit pas pouvoir écrire.
#   droits.ps1 <son dossier> <dossier d'un autre enfant, ou aucun> <fichier de résultat>
param([string]$Moi, [string]$Autre, [string]$Sortie)
$base = Join-Path $env:ProgramData 'Flocon'
function Essai($chemin) { try { [IO.File]::WriteAllText($chemin, '{}'); Remove-Item $chemin -ErrorAction SilentlyContinue; return $true } catch { return $false } }
$r = [ordered]@{
  compte = $env:USERNAME
  saBoite = Essai (Join-Path $base "boite\$Moi\essai.json")
  config = Essai (Join-Path $base 'config.json.essai')
  racineBoite = Essai (Join-Path $base 'boite\essai.json')
  sonEtat = Essai (Join-Path $base "enfants\$Moi\etat.json.essai")
  autreBoite = $(if ($Autre -and $Autre -ne 'aucun') { Essai (Join-Path $base "boite\$Autre\essai.json") } else { $false })
  litConfig = [bool](Get-Content (Join-Path $base 'config.json') -Raw -ErrorAction SilentlyContinue)
}
[IO.File]::WriteAllText($Sortie, ($r | ConvertTo-Json))
