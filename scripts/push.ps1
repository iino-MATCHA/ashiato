<#
  ashiato: コミット & GitHub(iino-matcha) への push フロー
  使い方: pwsh scripts/push.ps1 "コミットメッセージ"
  メッセージを省略した場合は "update" になります。
#>
param(
  [string]$Message = "update"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

git add -A

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Output "変更なし。コミットをスキップします。"
} else {
  git commit -m $Message
}

git push origin main
Write-Output "push完了: origin/main (iino-matcha)"
