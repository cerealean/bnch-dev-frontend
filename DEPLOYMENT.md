# Deployment to Dreamhost

This document provides instructions for setting up and using the deployment workflow for your Angular application to Dreamhost using GitHub Actions.

## Overview

The deployment system uses a separate workflow (`.github/workflows/deploy.yml`) that can be triggered manually with a specific semantic version. This approach provides better control over deployments and allows you to deploy any tagged version.

## Prerequisites

1. **Dreamhost FTP Access**: You need FTP credentials for your Dreamhost hosting account
2. **GitHub Repository Secrets**: You'll need to configure repository secrets for secure credential storage
3. **Semantic Versioning**: Your releases should follow semantic versioning (e.g., v1.2.3)

## Setup Instructions

### 1. Gather Dreamhost FTP Information

You'll need the following information from your Dreamhost hosting account:

- **FTP Server**: Usually in the format `ftp.yourdomain.com` or `ftp.dreamhost.com`
- **FTP Username**: Your FTP username (usually your domain or account username)
- **FTP Password**: Your FTP password
- **Server Directory**: The path where your website files should be uploaded (usually `public_html/` or the root directory `./`)

### 2. Configure GitHub Repository Secrets

Go to your GitHub repository and set up the following secrets:

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret** and add these three secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `DREAMHOST_FTP_SERVER` | Your Dreamhost FTP server address | `ftp.yourdomain.com` |
| `DREAMHOST_FTP_USERNAME` | Your FTP username | `your-ftp-username` |
| `DREAMHOST_FTP_PASSWORD` | Your FTP password | `your-secure-password` |

### 3. Set Up GitHub Environments (Optional)

For better deployment control, you can set up environments:

1. Go to **Settings** → **Environments**
2. Create environments named `production` and `staging`
3. Add protection rules if needed (e.g., required reviewers for production)

## How to Deploy

## How to Deploy

### Option 1: Using the Deploy Script (Recommended)

The easiest way to deploy is using the provided PowerShell script:

```powershell
# Deploy to production
.\deploy.ps1 -Version "v1.2.3"

# Deploy to staging
.\deploy.ps1 -Version "v1.3.0-beta.1" -Environment "staging"

# Test deployment (dry run)
.\deploy.ps1 -Version "v1.2.3" -DryRun

# Get help
.\deploy.ps1 -Help
```

**Prerequisites for the script:**
- GitHub CLI (`gh`) installed and authenticated
- PowerShell (available by default on Windows)

### Option 2: Manual Deployment via GitHub UI

1. **Go to Actions tab** in your GitHub repository
2. **Click on "Deploy to Dreamhost"** workflow
3. **Click "Run workflow"** button
4. **Fill in the parameters**:
   - **Version**: Enter the semantic version tag (e.g., `v1.2.3` or `1.2.3`)
   - **Environment**: Choose `production` or `staging`
   - **Dry run**: Check this to test the deployment without actually uploading files

### Option 3: Programmatic Deployment

You can also trigger deployments from other workflows or via the GitHub API:

```yaml
# Example: Trigger deployment after a successful release
- name: Deploy to production
  uses: ./.github/workflows/deploy.yml
  with:
    version: ${{ github.event.release.tag_name }}
    environment: production
```

## Deployment Features

### Version-Based Deployment
- **Specific Version Targeting**: Deploy any tagged version by specifying its semantic version
- **Git Tag Checkout**: The workflow checks out the exact code from the specified version tag
- **Version Validation**: Automatic validation of semantic version format

### Environment Support
- **Production**: Deploys to the root directory of your domain
- **Staging**: Deploys to a `/staging/` subdirectory for testing
- **Environment-Specific Builds**: Uses appropriate Angular build configurations

### Safety Features
- **Dry Run Mode**: Test deployments without actually uploading files
- **Pre-deployment Validation**: Runs tests and linting before deployment
- **Deployment Info**: Creates a deployment info file with version and timestamp information
- **Rollback Capability**: Automatic tracking of previous versions for easy rollback

### Enhanced Functionality
- **Angular Routing Support**: Includes `.htaccess` file from the project for proper routing
- **Security Headers**: Adds security headers via `.htaccess`
- **Static Asset Caching**: Configures browser caching for better performance
- **Gzip Compression**: Enables compression for faster loading
- **Deployment Artifacts**: Saves deployment information as downloadable artifacts

## Workflow Overview

The deployment workflow performs these steps:

1. **Validates** the semantic version format
2. **Checks out** the specific version from Git
3. **Installs** Node.js dependencies
4. **Runs tests** and linting to ensure code quality
5. **Builds** the Angular application with appropriate configuration
6. **Creates** deployment metadata and configuration files
7. **Uploads** files to Dreamhost via FTP
8. **Generates** a detailed deployment summary

## Built Files and Structure

The workflow uploads the following files from `./dist/bnch-benchmarker-app/browser/`:

- `index.html` - Your main application file
- JavaScript bundles - Compiled and optimized Angular code
- CSS files - Compiled styles
- Assets - Images, fonts, and other static files
- `worker-script.js` - Required for the @bnch/benchmarker library
- `deployment-info.json` - Metadata about the deployment
- `.htaccess` - Server configuration for Angular routing and security (from `public/.htaccess`)

## Examples

### Deploy a Production Release
```
Version: v1.2.3
Environment: production
Dry run: false
```

### Test a Staging Deployment
```
Version: v1.3.0-beta.1
Environment: staging
Dry run: true
```

## Rollback Deployments

If you need to rollback a deployment, you have several options:

### Option 1: Using the Rollback Script (Recommended)

```powershell
# Rollback to previous version automatically
.\rollback.ps1 -Environment "production"

# Rollback to a specific version
.\rollback.ps1 -Environment "staging" -Version "v1.2.0"

# Test rollback (dry run)
.\rollback.ps1 -Environment "production" -DryRun

# Get help
.\rollback.ps1 -Help
```

### Option 2: Using the Rollback Workflow

1. **Go to Actions tab** in your GitHub repository
2. **Click on "Rollback Deployment"** workflow
3. **Click "Run workflow"** button
4. **Fill in the parameters**:
   - **Environment**: Choose `production` or `staging`
   - **Target Version**: Leave empty for previous version or specify exact version
   - **Confirm Rollback**: Type `CONFIRM` to proceed

### Option 3: Manual Deployment of Previous Version

If you know the exact version to rollback to, you can use the regular deployment workflow:

```powershell
.\deploy.ps1 -Version "v1.2.0" -Environment "production"
```

## Rollback Features

- **🔍 Automatic Detection**: Finds the previous deployed version automatically
- **🎯 Specific Version**: Option to rollback to any specific version
- **⚠️ Safety Confirmation**: Requires explicit confirmation to prevent accidents
- **📊 Rollback History**: Tracks rollback operations for audit purposes
- **🔗 Integrated Workflow**: Uses the same deployment process for consistency

## Troubleshooting

### Common Issues

1. **FTP Connection Failed**
   - Verify your FTP server address, username, and password
   - Check if Dreamhost requires a specific port (default is 21)
   - Some hosts require FTPS (secure FTP) - you can try adding `protocol: ftps` to the workflow

2. **Files Not Appearing on Website**
   - Check if you need to upload to a subdirectory like `public_html/`
   - Verify the `server-dir` setting in the workflow

3. **Permission Denied**
   - Ensure your FTP user has write permissions to the target directory

### Advanced Configuration

If you need FTPS (secure FTP), modify the deployment step:

```yaml
- name: Deploy to Dreamhost via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.DREAMHOST_FTP_SERVER }}
    username: ${{ secrets.DREAMHOST_FTP_USERNAME }}
    password: ${{ secrets.DREAMHOST_FTP_PASSWORD }}
    protocol: ftps
    port: 990  # Common FTPS port, check with Dreamhost
    local-dir: ./dist/bnch-benchmarker-app/browser/
    server-dir: ./
```

### Testing Deployment (Dry Run)

To test the deployment without actually uploading files, you can temporarily add `dry-run: true` to see what would be uploaded:

```yaml
- name: Deploy to Dreamhost via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.DREAMHOST_FTP_SERVER }}
    username: ${{ secrets.DREAMHOST_FTP_USERNAME }}
    password: ${{ secrets.DREAMHOST_FTP_PASSWORD }}
    local-dir: ./dist/bnch-benchmarker-app/browser/
    server-dir: ./
    dry-run: true  # Remove this line when ready to deploy
```

## Alternative: SFTP Deployment

If Dreamhost provides SFTP access (which is more secure), you might want to consider using an SFTP deployment action instead. Let me know if you'd prefer this option.

## Security Notes

- Never commit FTP credentials directly to your repository
- Always use GitHub Secrets for sensitive information
- Consider using FTPS if your host supports it for encrypted file transfers
- Regularly rotate your FTP passwords for security
