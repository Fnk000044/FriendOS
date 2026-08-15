; FriendOS NSIS Installer Custom Script
; This script adds custom behavior to the installer

!macro customInit
  ; Check if FriendOS is already running
  nsExec::ExecToStack 'cmd /c tasklist /FI "IMAGENAME eq FriendOS.exe" /NH 2>&1 | findstr /I "FriendOS.exe"'
  Pop $0
  Pop $1
  ${If} $0 == "0"
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "FriendOS is currently running. Please close it before continuing." IDOK continue IDCANCEL abort
    abort:
      Abort
    continue:
      nsExec::ExecToLog 'taskkill /F /IM FriendOS.exe'
      Sleep 1000
  ${EndIf}
!macroend

!macro customInstall
  ; Create data directory for user data
  CreateDirectory "$APPDATA\FriendOS"
  CreateDirectory "$APPDATA\FriendOS\data"
  ; Notify Shell to refresh icon cache so the new exe icon is visible immediately
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInit
  ; Check if FriendOS is running during uninstall
  nsExec::ExecToStack 'cmd /c tasklist /FI "IMAGENAME eq FriendOS.exe" /NH 2>&1 | findstr /I "FriendOS.exe"'
  Pop $0
  Pop $1
  ${If} $0 == "0"
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "FriendOS is currently running. Please close it before uninstalling." IDOK continue IDCANCEL abort
    abort:
      Abort
    continue:
      nsExec::ExecToLog 'taskkill /F /IM FriendOS.exe'
      Sleep 1000
  ${EndIf}
!macroend

!macro customUnInstall
  ; Ask if user wants to keep their data
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to keep your FriendOS data (diaries, tasks, habits)?$\n$\nSelecting 'No' will delete all your data." IDYES keepData IDNO removeData
  
  removeData:
    RMDir /r "$APPDATA\FriendOS"
    Goto done
  
  keepData:
    ; Keep the data directory

  done:
  ; Notify Shell to refresh icon cache after uninstall
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
