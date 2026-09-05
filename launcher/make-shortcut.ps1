# Creates/updates the "MathsSolve Kids" desktop shortcut.
# Re-run this any time to refresh it.

$launcherDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "MathsSolve Kids.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = '"' + (Join-Path $launcherDir "run-hidden.vbs") + '"'
$shortcut.WorkingDirectory = Split-Path -Parent $launcherDir
$shortcut.Description = "Open MathsSolve Kids"
$shortcut.Save()

Write-Host "Shortcut created at $shortcutPath"
