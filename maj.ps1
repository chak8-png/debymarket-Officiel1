# ============================================================
# Debymarket - MISE A JOUR AUTOMATIQUE DU SITE
# ------------------------------------------------------------
# Comment l'utiliser (a chaque nouvelle mise a jour) :
#   1. Telecharge le fichier "debymarket-projet.zip"
#   2. Clic droit sur ce fichier maj.ps1
#      > "Executer avec PowerShell"
#      (si Windows refuse : ouvrir PowerShell dans ce dossier
#       et taper : powershell -ExecutionPolicy Bypass -File .\maj.ps1)
#   >>> SI WINDOWS AFFICHE "Controle intelligent des applications" :
#       clic droit sur maj.ps1 > Proprietes > cocher "Debloquer"
#       (tout en bas de l'onglet General) > OK, puis relancer. <<<
# Le script fait TOUT tout seul : extraction, copie PROPRE du
# contenu a la racine (jamais de doublon), envoi sur GitHub.
# ============================================================

$ErrorActionPreference = "Stop"

# Dossier du projet = dossier ou se trouve ce script
$root = $PSScriptRoot
if (-not $root -or -not (Test-Path (Join-Path $root ".git"))) {
  $root = "C:\Users\PC MARKET\Downloads\debymarket-officiel1"
}
$me = Join-Path $root "maj.ps1"
# Journal de bord : ecrit d'abord en TEMP puis depose dans le dossier a la fin,
# sinon l'etape de nettoyage se heurte a son propre fichier verrouille.
$script:logTmp = Join-Path $env:TEMP "debymarket-maj-log.txt"

function Stop-WithMsg($msg) {
  Write-Host ""
  Write-Host "ERREUR : $msg" -ForegroundColor Red
  Write-Host ""
  Write-Host "AIDE : fais une PHOTO de cet ecran ou envoie le fichier 'maj-log.txt'" -ForegroundColor Yellow
  Write-Host "      (il est dans ce dossier) a ton developpeur." -ForegroundColor Yellow
  try { Stop-Transcript | Out-Null } catch { }
  try { Copy-Item $script:logTmp (Join-Path $root "maj-log.txt") -Force } catch { }
  Read-Host "Appuie sur Entree pour fermer"
  exit 1
}

try {
  Set-Location $root
  # Journal de bord : tout ce qui s'affiche est aussi ecrit dans maj-log.txt
  try { Start-Transcript -Path $script:logTmp -Force | Out-Null } catch { }
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host "  Debymarket - Mise a jour automatique" -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host "Projet : $root"
  Write-Host ""

  # 0. Verifier que Git est present (moteur invisible du script)
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git n'est pas installe sur ce PC. Installation automatique..." -ForegroundColor Yellow
    $installed = $false
    try {
      winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
      $installed = $true
    } catch { }
    Write-Host ""
    if ($installed) {
      Write-Host "Git est installe. Fermez cette fenetre et RELANCEZ maj.ps1." -ForegroundColor Green
    } else {
      Write-Host "ERREUR : installation automatique impossible." -ForegroundColor Red
      Write-Host "Installez Git manuellement : https://git-scm.com/download/win (options par defaut), puis relancez maj.ps1."
    }
    Read-Host "Appuie sur Entree pour fermer"
    exit 1
  }

  # Identite Git de secours (au cas ou elle ne serait pas configuree)
  if (-not (git config user.name)) { git config user.name "Debymarket" | Out-Null }
  if (-not (git config user.email)) { git config user.email "dev@debymarket.ci" | Out-Null }

  # Reparer l'assistant d'identifiants Git (manager-core = ancien nom obsolete)
  $helper = ((git config credential.helper 2>$null) | Out-String).Trim()
  if ($helper -match "manager-core") {
    $null = (git credential-manager version 2>$null)
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Assistant d'identifiants Git obsolete : mise a jour de Git..." -ForegroundColor Yellow
      try { winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements } catch { }
      $null = (git credential-manager version 2>$null)
    }
    if ($LASTEXITCODE -eq 0) {
      git config --global --unset-all credential.helper 2>$null | Out-Null
      git config --global credential.helper manager | Out-Null
      Write-Host "Identifiants Git repares (manager-core -> manager)." -ForegroundColor Yellow
    }
  }

  # 1. Trouver le zip le plus recent (Telechargements puis Bureau)
  $zip = $null
  foreach ($dir in @("$env:USERPROFILE\Downloads", "$env:USERPROFILE\Desktop")) {
    if (Test-Path $dir) {
      $zip = Get-ChildItem (Join-Path $dir "debymarket-projet*.zip") -ErrorAction SilentlyContinue |
             Sort-Object LastWriteTime -Descending | Select-Object -First 1
      if ($zip) { break }
    }
  }
  if (-not $zip) {
    Stop-WithMsg "Zip 'debymarket-projet.zip' introuvable dans Telechargements ni sur le Bureau. Telecharge-le d'abord, puis relance ce script."
  }
  Write-Host "Zip trouve : $($zip.FullName) ($([math]::Round($zip.Length/1MB,1)) Mo)" -ForegroundColor Green
  if ($zip.LastWriteTime -lt (Get-Date).AddHours(-24)) {
    Write-Host "ATTENTION : ce zip date de plus de 24h. Verifie que c'est bien le DERNIER telecharge." -ForegroundColor Yellow
  }
  Read-Host "Appuie sur Entree pour lancer la mise a jour (Ctrl+C pour annuler)"

  # 2. Sauvegarder .env.local (reglages locaux, jamais dans le zip)
  $envBak = $null
  if (Test-Path "$root\.env.local") {
    $envBak = Join-Path $env:TEMP "debymarket-env.local"
    Copy-Item "$root\.env.local" $envBak -Force
    Write-Host "Reglages locaux (.env.local) sauvegardes"
  }

  # 3. Vider le dossier SAUF .git, ce script et le journal (anti-doublon garanti)
  Get-ChildItem $root -Force |
    Where-Object { $_.Name -ne ".git" -and $_.Name -ne "maj.ps1" -and $_.Name -ne "maj-log.txt" } |
    Remove-Item -Recurse -Force
  Write-Host "1/4 - Ancien contenu efface (historique .git conserve)" -ForegroundColor Green

  # 4. Extraire le zip dans un dossier temporaire
  $tmp = Join-Path $env:TEMP "debymarket-maj"
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $zip.FullName -DestinationPath $tmp -Force
  Write-Host "2/4 - Zip extrait" -ForegroundColor Green

  # 5. Copier le CONTENU de debymarket\ a la racine (fichiers caches inclus)
  $src = Join-Path $tmp "debymarket"
  if (-not (Test-Path $src)) { Stop-WithMsg "Structure du zip inattendue (dossier 'debymarket' absent)." }
  Copy-Item -Path (Join-Path $src "*") -Destination $root -Recurse -Force
  Get-ChildItem $src -Force | Where-Object { $_.Name.StartsWith(".") -and $_.Name -ne ".git" } |
    ForEach-Object { Copy-Item $_.FullName $root -Recurse -Force }
  Write-Host "3/4 - Nouvelle version en place (a la racine, sans sous-dossier)" -ForegroundColor Green

  # 6. Remettre .env.local si besoin + restaurer ce script + nettoyage
  if ($envBak -and -not (Test-Path "$root\.env.local")) { Copy-Item $envBak "$root\.env.local" -Force }
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue

  # 7. Envoi sur GitHub -> deploiement Render automatique
  # ATTENTION : git ecrit meme ses messages de SUCCES ("To https://...")
  # sur le canal "rouge". Sous PowerShell 5.1 avec ErrorActionPreference=Stop,
  # ce bavardage normal serait transforme en fausse erreur -> on assouplit
  # temporairement, et on juge seulement le code de sortie (0 = succes).
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  git add -A
  git commit -m ("maj du " + (Get-Date -Format "dd/MM/yyyy HH:mm")) | Out-Null
  $pushOut = git push 2>&1 | Out-String
  $pushCode = $LASTEXITCODE
  if ($pushCode -ne 0) {
    # identifiant GitHub peut-etre perime : reset + nouvelle tentative
    Write-Host ""
    Write-Host "Premier envoi refuse : reinitialisation de l'identifiant GitHub..." -ForegroundColor Yellow
    "protocol=https`nhost=github.com`n" | git credential-manager erase 2>$null | Out-Null
    Write-Host ">>> Si une page GitHub s'ouvre dans le navigateur : connectez-vous (compte GitHub du projet). <<<" -ForegroundColor Yellow
    $pushOut = git push 2>&1 | Out-String
    $pushCode = $LASTEXITCODE
  }
  $ErrorActionPreference = $prevEAP
  if ($pushCode -ne 0) {
    Stop-WithMsg "Le push GitHub a echoue. DETAIL TECHNIQUE : $pushOut"
  }

  Write-Host "4/4 - Code envoye sur GitHub" -ForegroundColor Green
  Write-Host ""
  Write-Host "==============================================" -ForegroundColor Green
  Write-Host "  TERMINE ! Render deploie tout seul (~3 min)." -ForegroundColor Green
  Write-Host "  Verifie ensuite : https://debymarket.com" -ForegroundColor Green
  Write-Host "==============================================" -ForegroundColor Green
  try { Stop-Transcript | Out-Null } catch { }
  try { Copy-Item $script:logTmp (Join-Path $root "maj-log.txt") -Force } catch { }
  Read-Host "Appuie sur Entree pour fermer"
} catch {
  Stop-WithMsg $_.Exception.Message
}
