#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

#z::
	continue := true
	Loop, 1000
	{
		FileReadLine, accountId, locationIDs.csv, %A_Index%
		Sleep, 2000
		MouseClick, left, 50, 250 ;click in search input
		Sleep, 2000
		Send, %accountId%
		Sleep, 2000
		Send, {enter}
		Sleep, 2000
		MouseClick, left, 260, 210 ;click on locationID
		Sleep, 2000
			;with autoClicker running there's no need to click the save button
		
		if continue = false
		break
	}

Return

^z:: continue := false
exitapp