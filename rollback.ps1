#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Rollback script for reverting deployments

.DESCRIPTION
    This script helps rollback deployments to previous versions via GitHub CLI or provides instructions for manual rollback.

.PARAMETER Environment
    The target environment: "production" or "staging" (default: "production")

.PARAMETER Version
    The specific version to rollback to (optional - will use previous version if not specified)

.PARAMETER DryRun
    Show what would be rolled back without actually doing it (default: false)

.PARAMETER Help
    Show this help message

.EXAMPLE
    .\rollback.ps1 -Environment "production"
    Rollback production to the previous version

.EXAMPLE
    .\rollback.ps1 -Environment "staging" -Version "v1.2.0"
    Rollback staging to a specific version

.EXAMPLE
    .\rollback.ps1 -Environment "production" -DryRun
    Show what would be rolled back without doing it
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("production", "staging")]
    [string]$Environment = "production",
    
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

function Show-Help {
    Write-Host @"
🔄 BNCH Benchmarker App - Rollback Script

USAGE:
    .\rollback.ps1 [-Environment <env>] [-Version <version>] [-DryRun]

PARAMETERS:
    -Environment  Target environment: production or staging (default: production)
    -Version      Specific version to rollback to (optional)
    -DryRun       Show what would be rolled back without doing it
    -Help         Show this help message

EXAMPLES:
    .\rollback.ps1 -Environment "production"
    .\rollback.ps1 -Environment "staging" -Version "v1.2.0"
    .\rollback.ps1 -Environment "production" -DryRun

ROLLBACK METHODS:
    1. Automatic: Uses deployment history to find previous version
    2. Manual: Specify exact version to rollback to

PREREQUISITES:
    1. GitHub CLI (gh) installed and authenticated
    2. Access to the repository's Actions
    3. Deployment history available (for automatic rollback)

MANUAL ROLLBACK:
    If you prefer to rollback manually:
    1. Go to https://github.com/cerealean/bnch-dev-frontend/actions
    2. Click on "Rollback Deployment" workflow
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

function Get-PreviousVersion {
    param([string]$Environment)
    
    Write-Host "🔍 Looking for previous deployment..." -ForegroundColor Yellow
    
    try {
        # Download the latest deployment artifact to get previous version
        $artifactName = "deployment-info-$Environment-latest"
        
        # Use gh CLI to download artifact from latest successful run
        $runs = gh run list --workflow=deploy.yml --status=success --limit=5 --json=databaseId | ConvertFrom-Json
        
        foreach ($run in $runs) {
            try {
                gh run download $run.databaseId --name $artifactName --dir "temp-rollback" 2>$null
                if (Test-Path "temp-rollback\previous-version.txt") {
                    $previousVersion = Get-Content "temp-rollback\previous-version.txt" -Raw
                    Remove-Item "temp-rollback" -Recurse -Force
                    
                    if ($previousVersion -and $previousVersion.Trim() -ne "none") {
                        return $previousVersion.Trim()
                    }
                }
            }
            catch {
                # Continue to next run
            }
        }
        
        return $null
    }
    catch {
        Write-Host "⚠️ Could not retrieve deployment history: $_" -ForegroundColor Yellow
        return $null
    }
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

function Start-Rollback {
    param(
        [string]$Environment,
        [string]$Version,
        [bool]$IsDryRun
    )
    
    Write-Host "🔄 Starting rollback..." -ForegroundColor Green
    Write-Host "   Environment: $Environment" -ForegroundColor Cyan
    Write-Host "   Version: $Version" -ForegroundColor Cyan
    Write-Host "   Dry Run: $IsDryRun" -ForegroundColor Cyan
    Write-Host ""
    
    if ($IsDryRun) {
        Write-Host "🧪 DRY RUN MODE - No actual rollback will be performed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "The following rollback would be triggered:" -ForegroundColor White
        Write-Host "   Environment: $Environment" -ForegroundColor Gray
        Write-Host "   Target Version: $Version" -ForegroundColor Gray
        Write-Host ""
        Write-Host "To execute the rollback, run the same command without -DryRun" -ForegroundColor Yellow
        return
    }
    
    # Confirm rollback
    Write-Host "⚠️  WARNING: This will rollback $Environment to version $Version" -ForegroundColor Red
    $confirmation = Read-Host "Type 'CONFIRM' to proceed with rollback"
    
    if ($confirmation -ne "CONFIRM") {
        Write-Host "❌ Rollback cancelled." -ForegroundColor Red
        return
    }
    
    try {
        gh workflow run rollback.yml `
            --field environment=$Environment `
            --field target_version=$Version `
            --field confirm_rollback="CONFIRM"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Rollback workflow triggered successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🔗 Monitor rollback progress at:" -ForegroundColor Yellow
            Write-Host "   https://github.com/cerealean/bnch-dev-frontend/actions" -ForegroundColor Blue
            Write-Host ""
            Write-Host "📊 You can also run:" -ForegroundColor Yellow
            Write-Host "   gh run list --workflow=rollback.yml" -ForegroundColor Gray
        }
        else {
            Write-Host "❌ Failed to trigger rollback workflow." -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error triggering rollback: $_" -ForegroundColor Red
    }
}

# Main script logic
if ($Help) {
    Show-Help
    exit 0
}

if (-not (Test-Prerequisites)) {
    Write-Host ""
    Write-Host "🌐 You can still rollback manually:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://github.com/cerealean/bnch-dev-frontend/actions" -ForegroundColor Blue
    Write-Host "   2. Click 'Rollback Deployment' workflow" -ForegroundColor Blue
    Write-Host "   3. Click 'Run workflow' and fill in:" -ForegroundColor Blue
    Write-Host "      - Environment: $Environment" -ForegroundColor Gray
    Write-Host "      - Target Version: $Version" -ForegroundColor Gray
    Write-Host "      - Confirm: CONFIRM" -ForegroundColor Gray
    exit 1
}

# Determine rollback version
if ([string]::IsNullOrWhiteSpace($Version)) {
    Write-Host "🔍 No version specified, looking for previous version..." -ForegroundColor Yellow
    $Version = Get-PreviousVersion -Environment $Environment
    
    if ([string]::IsNullOrWhiteSpace($Version)) {
        Write-Host "❌ Could not determine previous version automatically." -ForegroundColor Red
        Write-Host "   Please specify a version using -Version parameter" -ForegroundColor Yellow
        Write-Host "   Example: .\rollback.ps1 -Environment $Environment -Version `"v1.2.3`"" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "✅ Found previous version: $Version" -ForegroundColor Green
}

if (-not (Test-VersionFormat -Version $Version)) {
    Write-Host "❌ Invalid semantic version format: $Version" -ForegroundColor Red
    Write-Host "   Expected format: v1.2.3 or 1.2.3" -ForegroundColor Yellow
    exit 1
}

Start-Rollback -Environment $Environment -Version $Version -IsDryRun $DryRun
