# Manual Staging Deployment Script
# This script allows you to manually trigger staging deployments

param(
    [string]$Version = "",
    [switch]$DryRun = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host @"
Manual Staging Deployment Script

USAGE:
    .\deploy-staging.ps1 [-Version <version>] [-DryRun] [-Help]

PARAMETERS:
    -Version    Specific version to deploy (e.g., 'v1.2.3' or '1.2.3')
                If not provided, will deploy the latest tagged version
    -DryRun     Perform a dry run without actually deploying
    -Help       Show this help message

EXAMPLES:
    .\deploy-staging.ps1                    # Deploy latest version to staging
    .\deploy-staging.ps1 -Version v1.2.3   # Deploy specific version to staging
    .\deploy-staging.ps1 -DryRun            # Test deployment without uploading

PREREQUISITES:
    - GitHub CLI (gh) must be installed and authenticated
    - You must have access to trigger workflows in the repository

"@
    exit 0
}

Write-Host "🚀 Manual Staging Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: GitHub CLI (gh) is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install GitHub CLI from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Not authenticated with GitHub CLI" -ForegroundColor Red
    Write-Host "Please run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI is authenticated" -ForegroundColor Green

# Prepare deployment parameters
$deployParams = @(
    "--field", "environment=staging"
)

if ($Version) {
    # Normalize version (ensure it doesn't start with 'v' for the input)
    $normalizedVersion = $Version -replace '^v', ''
    $deployParams += "--field", "version=$normalizedVersion"
    Write-Host "📦 Deploying version: $normalizedVersion" -ForegroundColor Blue
} else {
    Write-Host "📦 Deploying latest version (will be determined by workflow)" -ForegroundColor Blue
}

if ($DryRun) {
    $deployParams += "--field", "dry_run=true"
    Write-Host "🧪 Running in DRY RUN mode (no files will be uploaded)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Triggering deployment workflow..." -ForegroundColor Blue

# Execute the deployment
try {
    $result = gh workflow run deploy.yml @deployParams 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment workflow triggered successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔗 You can monitor the deployment at:" -ForegroundColor Blue
        
        # Get the repository info
        $repoInfo = gh repo view --json url,name,owner
        $repo = $repoInfo | ConvertFrom-Json
        $actionsUrl = "$($repo.url)/actions"
        
        Write-Host "   $actionsUrl" -ForegroundColor Cyan
        Write-Host ""
        
        if (-not $DryRun) {
            Write-Host "🌐 Staging URL (after deployment completes):" -ForegroundColor Blue
            Write-Host "   https://staging.bnch.dev" -ForegroundColor Cyan
        }
        
        # Offer to open the actions page
        $openActions = Read-Host "Would you like to open the Actions page in your browser? (y/N)"
        if ($openActions -eq 'y' -or $openActions -eq 'Y') {
            Start-Process $actionsUrl
        }
        
    } else {
        Write-Host "❌ Failed to trigger deployment workflow" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error occurred while triggering deployment: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Script completed successfully!" -ForegroundColor Green
