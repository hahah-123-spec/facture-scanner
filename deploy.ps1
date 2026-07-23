$td = "$env:TEMP\facture-deploy"
Remove-Item $td -Recurse -Force -ErrorAction SilentlyContinue

# Save webapp from master
Copy-Item webapp $td -Recurse -Force
Copy-Item $td deploy.ps1 -Force -ErrorAction SilentlyContinue

# Switch to gh-pages
git checkout gh-pages

# Clean everything except .git
Get-ChildItem -Exclude .git | Remove-Item -Recurse -Force

# Copy webapp back
Copy-Item "$td\*" . -Recurse -Force
Remove-Item $td -Recurse -Force

# Remove non-webapp files that accidentally got copied
Remove-Item deploy.ps1, CONVERSION.md, README.md, netlify.toml -ErrorAction SilentlyContinue

# Deploy
git add -A
git commit -m "deploy"
git push origin gh-pages

# Back to master
git checkout master
Write-Host "Done! https://hahah-123-spec.github.io/facture-scanner/"
