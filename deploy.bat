@echo off
echo Deploying webapp to GitHub Pages...

:: Save webapp from master
git stash
git checkout master
xcopy /E /Y /Q webapp %TEMP%\facture-deploy\

:: Switch to gh-pages and update
git checkout gh-pages
del /Q *.* 2>nul
rmdir /S /Q css js 2>nul
xcopy /E /Y /Q %TEMP%\facture-deploy\* .
rmdir /S /Q %TEMP%\facture-deploy

:: Commit and push
git add -A
git commit -m "deploy"
git push origin gh-pages

:: Back to master
git checkout master
git stash pop 2>nul
echo Done! Website updated.
