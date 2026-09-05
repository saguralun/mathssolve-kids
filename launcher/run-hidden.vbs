' Runs start-mathssolve.bat with its window fully hidden, so double-clicking
' the MathsSolve Kids desktop shortcut never flashes a console window at all.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(scriptDir, "..\start-mathssolve.bat")
shell.Run """" & batPath & """", 0, False
