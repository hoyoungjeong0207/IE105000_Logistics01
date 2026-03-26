# Netlify Deployment Script for Windows PowerShell
# Make sure you have Netlify CLI installed: npm install -g netlify-cli

Write-Host "Deploying to Netlify..." -ForegroundColor Green

# Navigate to the site directory
Set-Location $PSScriptRoot

# Deploy to Netlify (interactive login on first use)
netlify deploy --prod --dir .

Write-Host "Deployment complete!" -ForegroundColor Green
