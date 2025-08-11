# Alternative Deployment Workflows

This file contains alternative deployment configurations you can use instead of or in addition to the main FTP deployment.

## Option 1: SFTP Deployment (More Secure)

If your Dreamhost hosting supports SFTP (SSH File Transfer Protocol), this is a more secure option:

```yaml
  deploy-sftp:
    name: Deploy to Dreamhost via SFTP
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Angular application
        run: npm run build

      - name: Deploy to Dreamhost via SFTP
        uses: wlixcc/SFTP-Deploy-Action@v1.2.4
        with:
          server: ${{ secrets.DREAMHOST_SFTP_SERVER }}
          username: ${{ secrets.DREAMHOST_SSH_USERNAME }}
          password: ${{ secrets.DREAMHOST_SSH_PASSWORD }}
          local_path: './dist/bnch-benchmarker-app/browser/*'
          remote_path: '/home/username/yourdomain.com'
          sftp_only: true
```

**Required Secrets for SFTP:**
- `DREAMHOST_SFTP_SERVER`: Your domain or server address
- `DREAMHOST_SSH_USERNAME`: Your SSH username
- `DREAMHOST_SSH_PASSWORD`: Your SSH password

## Option 2: Deploy to Subdirectory

If you want to deploy to a subdirectory (e.g., for staging):

```yaml
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Angular application
        run: npm run build

      - name: Deploy to Dreamhost Staging
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.DREAMHOST_FTP_SERVER }}
          username: ${{ secrets.DREAMHOST_FTP_USERNAME }}
          password: ${{ secrets.DREAMHOST_FTP_PASSWORD }}
          local-dir: ./dist/bnch-benchmarker-app/browser/
          server-dir: ./staging/
```

## Option 3: Deploy with Custom Domain Configuration

If you need to deploy with environment-specific configurations:

```yaml
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Angular application for production
        run: npm run build -- --configuration=production

      - name: Create .htaccess for Angular routing
        run: |
          cat > ./dist/bnch-benchmarker-app/browser/.htaccess << 'EOF'
          RewriteEngine On
          RewriteBase /
          RewriteRule ^index\.html$ - [L]
          RewriteCond %{REQUEST_FILENAME} !-f
          RewriteCond %{REQUEST_FILENAME} !-d
          RewriteRule . /index.html [L]
          EOF

      - name: Deploy to Dreamhost
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.DREAMHOST_FTP_SERVER }}
          username: ${{ secrets.DREAMHOST_FTP_USERNAME }}
          password: ${{ secrets.DREAMHOST_FTP_PASSWORD }}
          local-dir: ./dist/bnch-benchmarker-app/browser/
          server-dir: ./
```

## Option 4: Deploy Only on Release

Deploy only when a GitHub release is created:

```yaml
  deploy-release:
    name: Deploy Release to Production
    runs-on: ubuntu-latest
    if: github.event_name == 'release' && github.event.action == 'published'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --browsers=ChromeHeadless --watch=false

      - name: Build Angular application
        run: npm run build

      - name: Deploy to Dreamhost
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.DREAMHOST_FTP_SERVER }}
          username: ${{ secrets.DREAMHOST_FTP_USERNAME }}
          password: ${{ secrets.DREAMHOST_FTP_PASSWORD }}
          local-dir: ./dist/bnch-benchmarker-app/browser/
          server-dir: ./
```

## Usage Instructions

1. **Choose the deployment method** that best fits your needs
2. **Replace the current deploy job** in `.github/workflows/ci-cd.yml` with your chosen option
3. **Configure the required secrets** in your GitHub repository settings
4. **Customize paths and settings** according to your Dreamhost setup

## Dreamhost-Specific Notes

- **Shared Hosting**: Use FTP/FTPS deployment
- **VPS/Dedicated**: SFTP is usually available and recommended
- **Domain Path**: Check your Dreamhost control panel for the correct upload path
- **File Permissions**: Dreamhost usually handles file permissions automatically

## Testing Your Deployment

1. Use the dry-run option first to see what will be uploaded
2. Deploy to a staging subdirectory before going to production
3. Monitor the GitHub Actions logs for any deployment issues
4. Check your live website to ensure everything works correctly
