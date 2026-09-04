@echo off
rem Signs one file for `pnpm build`. Tauri calls this once per artifact — the
rem application executable and then the installer — with the path as %1.
rem
rem The password comes from the environment, not from the command line, because
rem the Tauri CLI prints the sign command it runs. `scripts/tauri-build.mjs` sets
rem CERTIFICATE_PATH, SIGNTOOL_PATH and TIMESTAMP_URL before calling this.
setlocal

if "%~1"=="" (
  >&2 echo sign: no file to sign was given.
  exit /b 2
)

if not defined CERTIFICATE_PASSWORD (
  >&2 echo sign: CERTIFICATE_PASSWORD is not set.
  exit /b 2
)

if not defined CERTIFICATE_PATH set "CERTIFICATE_PATH=%~dp0..\cert\cendrive.pfx"
if not exist "%CERTIFICATE_PATH%" (
  >&2 echo sign: no certificate at "%CERTIFICATE_PATH%".
  exit /b 2
)

rem Only a fallback: the build script normally resolves the Windows SDK copy.
if not defined SIGNTOOL_PATH set "SIGNTOOL_PATH=signtool.exe"
if not defined TIMESTAMP_URL set "TIMESTAMP_URL=http://timestamp.digicert.com"

rem /fd is the file digest, /td the timestamp digest, /tr an RFC 3161 timestamp
rem server. Without a timestamp the signature expires with the certificate.
"%SIGNTOOL_PATH%" sign /fd sha256 /td sha256 /tr "%TIMESTAMP_URL%" ^
  /f "%CERTIFICATE_PATH%" /p "%CERTIFICATE_PASSWORD%" "%~1"

if errorlevel 1 (
  >&2 echo sign: signtool failed for "%~1".
  exit /b 1
)
