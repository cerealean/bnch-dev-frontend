#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy script for triggering GitHub Actions deployment workflow

.DESCRIPTION
    This script helps trigger the deployment workflow via GitHub CLI or provides instructions for manual deployment.

.PARAMETER Version
    The semantic version to deploy (e.g., "v1.2.3" or "1.2.3")

.PARAMETER Environment
    The target environment: "production" or "staging" (default: "production")

.PARAMETER DryRun
    Perform a dry run without actually uploading files (default: false)

.PARAMETER Help
    Show this help message

.EXAMPLE
    .\deploy.ps1 -Version "v1.2.3"
    Deploy version 1.2.3 to production

.EXAMPLE
    .\deploy.ps1 -Version "v1.3.0-beta.1" -Environment "staging" -DryRun
    Test deployment of beta version to staging
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

function Show-Help {
    Write-Host @"
🚀 BNCH Benchmarker App - Deployment Script

USAGE:
    .\deploy.ps1 -Version <semantic-version> [-Environment <env>] [-DryRun]

PARAMETERS:
    -Version      Semantic version to deploy (e.g., v1.2.3, 1.2.3)
    -Environment  Target environment: production or staging (default: production)
    -DryRun       Test deployment without uploading files
    -Help         Show this help message

EXAMPLES:
    .\deploy.ps1 -Version "v1.2.3"
    .\deploy.ps1 -Version "v1.3.0-beta.1" -Environment "staging" -DryRun

PREREQUISITES:
    1. GitHub CLI (gh) installed and authenticated
    2. Access to the repository's Actions
    3. Valid semantic version tag exists in the repository

MANUAL DEPLOYMENT:
    If you prefer to deploy manually:
    1. Go to https://github.com/cerealean/bnch-dev-frontend/actions
    2. Click on "Deploy to Dreamhost" workflow
    3. Click "Run workflow"
    4. Fill in the parameters and click "Run workflow"
"@
}

function Test-Prerequisites {
    # Check if gh CLI is installed
    if (-not (Get-Command "gh" -ErrorAction SilentlyContinue)) {
        Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
        Write-Host "   Please install it from: https://cli.github.com/" -ForegroundColor Yellow
        return $false
    }
    
    # Check if authenticated
    try {
        $null = gh auth status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ GitHub CLI is not authenticated." -ForegroundColor Red
            Write-Host "   Please run: gh auth login" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ GitHub CLI authentication check failed." -ForegroundColor Red
        return $false
    }
    
    return $true
}

function Test-VersionFormat {
    param([string]$Version)
    
    if ([string]::IsNullOrWhiteSpace($Version)) {
        return $false
    }
    
    # Remove 'v' prefix if present for validation
    $cleanVersion = $Version -replace '^v', ''
    
    # Basic semantic version pattern
    $semverPattern = '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$'
    
    return $cleanVersion -match $semverPattern
}

function Start-Deployment {
    param(
        [string]$Version,
        [string]$Environment,
        [bool]$IsDryRun
    )
    
    Write-Host "🚀 Starting deployment..." -ForegroundColor Green
    Write-Host "   Version: $Version" -ForegroundColor Cyan
    Write-Host "   Environment: $Environment" -ForegroundColor Cyan
    Write-Host "   Dry Run: $IsDryRun" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        gh workflow run deploy.yml `
            --field version=$Version `
            --field environment=$Environment `
            --field dry_run=$($IsDryRun.ToString().ToLower())
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Deployment workflow triggered successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔗 View deployment progress at:" -ForegroundColor Yellow
            Write-Host "   https://github.com/cerealean/bnch-dev-frontend/actions" -ForegroundColor Blue
            Write-Host ""
            Write-Host "📊 You can also run:" -ForegroundColor Yellow
            Write-Host "   gh run list --workflow=deploy.yml" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ Failed to trigger deployment workflow." -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error triggering deployment: $_" -ForegroundColor Red
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    Write-Host "❌ Version parameter is required." -ForegroundColor Red
    Write-Host "   Use -Help for more information." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-VersionFormat -Version $Version)) {
    Write-Host "❌ Invalid semantic version format: $Version" -ForegroundColor Red
    Write-Host "   Expected format: v1.2.3 or 1.2.3" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Prerequisites)) {
    Write-Host ""
    Write-Host "🌐 You can still deploy manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://github.com/cerealean/bnch-dev-frontend/actions" -ForegroundColor Blue
    Write-Host "   2. Click 'Deploy to Dreamhost' workflow" -ForegroundColor Blue
    Write-Host "   3. Click 'Run workflow' and fill in:" -ForegroundColor Blue
    Write-Host "      - Version: $Version" -ForegroundColor Gray
    Write-Host "      - Environment: $Environment" -ForegroundColor Gray
    Write-Host "      - Dry run: $DryRun" -ForegroundColor Gray
    exit 1
}

Start-Deployment -Version $Version -Environment $Environment -IsDryRun $DryRun
