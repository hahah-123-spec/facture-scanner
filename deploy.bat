@echo off
echo Deploying to GitHub Pages...

:: Save webapp from master branch
xcopy /E /Y /Q webapp %TEMP%\facture-deploy\

:: Switch to gh-pages
git checkout gh-pages

:: Clean everything except .git
for /F "delims=" %%i in ('dir /B') do if not "%%i"==".git" del /Q /S "%%i" 2>nul & rmdir /S /Q "%%i" 2>nul

:: Copy webapp
xcopy /E /Y /Q %TEMP%\facture-deploy\* .
rmdir /S /Q %TEMP%\facture-deploy

:: Deploy
git add -A
git commit -m "deploy"
git push origin gh-pages

:: Back
git checkout master
echo Done
