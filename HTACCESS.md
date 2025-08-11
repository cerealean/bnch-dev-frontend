# .htaccess Configuration

This document explains the `.htaccess` file configuration used for the Angular application deployment on Dreamhost.

## File Location

The `.htaccess` file is located at `public/.htaccess` and is automatically included in the Angular build process through the assets configuration in `angular.json`.

## Configuration Features

### 1. Angular Routing Support
```apache
# Handle Angular routes
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```
- Ensures that all routes are handled by Angular's router
- Redirects non-existent files/directories to `index.html`
- Essential for Single Page Application (SPA) functionality

### 2. Security Headers
```apache
# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```
- **X-Content-Type-Options**: Prevents MIME type sniffing attacks
- **X-Frame-Options**: Prevents clickjacking by denying iframe embedding
- **X-XSS-Protection**: Enables browser XSS filtering

### 3. Static Asset Caching
```apache
# Cache static assets
<filesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
</filesMatch>
```
- Sets 1-month cache expiration for static assets
- Improves page load performance for returning visitors
- Reduces server load and bandwidth usage

### 4. Gzip Compression
```apache
# Gzip compression and deflate compression
```
- Compresses text-based files (HTML, CSS, JS) before sending to browser
- Significantly reduces file sizes and improves load times
- Includes fallback for different Apache versions

## Customization

### Environment-Specific Configuration

If you need different configurations for staging vs production, you can:

1. **Create environment-specific files**:
   - `public/.htaccess.production`
   - `public/.htaccess.staging`

2. **Update the deployment workflow** to copy the appropriate file:
   ```yaml
   - name: Set environment-specific .htaccess
     run: |
       if [ "${{ inputs.environment }}" = "production" ]; then
         cp ./public/.htaccess.production ./dist/bnch-benchmarker-app/browser/.htaccess
       else
         cp ./public/.htaccess.staging ./dist/bnch-benchmarker-app/browser/.htaccess
       fi
   ```

### Additional Security Headers

You can add more security headers if needed:

```apache
# Additional security headers
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Content-Security-Policy "default-src 'self'"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### Custom Cache Rules

Adjust caching for different file types:

```apache
# Different cache times for different assets
<filesMatch "\.(css|js)$">
  ExpiresDefault "access plus 1 week"
</filesMatch>

<filesMatch "\.(png|jpg|jpeg|gif|ico|svg)$">
  ExpiresDefault "access plus 3 months"
</filesMatch>

<filesMatch "\.(woff|woff2|ttf|eot)$">
  ExpiresDefault "access plus 1 year"
</filesMatch>
```

## Testing

### Local Testing
You can test the `.htaccess` configuration locally if you have Apache running:
1. Place the file in your local web server directory
2. Test Angular routing by navigating to non-root routes
3. Check browser developer tools for security headers

### Staging Testing
Use the staging environment to test changes before production:
```powershell
.\deploy.ps1 -Version "v1.2.3" -Environment "staging" -DryRun
```

## Dreamhost Compatibility

This `.htaccess` configuration is designed to work with Dreamhost's Apache servers. The configuration includes:

- **mod_rewrite** for URL rewriting (Angular routing)
- **mod_expires** for cache control
- **mod_headers** for security headers
- **mod_deflate/mod_gzip** for compression

These modules are typically available on most shared hosting providers including Dreamhost.

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check if all Apache modules are available
   - Comment out sections one by one to identify problematic directives

2. **Caching Not Working**
   - Verify that `mod_expires` is enabled on your host
   - Check browser developer tools Network tab for cache headers

3. **Security Headers Not Applied**
   - Confirm that `mod_headers` is available
   - Use online security header checkers to verify

### Debugging Commands

Check which modules are available (if you have shell access):
```bash
apache2ctl -M  # or httpd -M
```

Test .htaccess syntax:
```bash
apachectl configtest
```

## Version Control Benefits

By keeping the `.htaccess` file in version control:

- ✅ **Tracked changes**: All modifications are versioned
- ✅ **Environment consistency**: Same configuration across deployments
- ✅ **Team collaboration**: Changes can be reviewed via pull requests
- ✅ **Rollback capability**: Easy to revert problematic changes
- ✅ **Documentation**: Changes are documented in commit messages
