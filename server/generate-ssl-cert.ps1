# SSL Certificate Generation Script (PowerShell)
# Generates self-signed SSL certificates for HTTPS development

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "SSL Certificate Generator" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if OpenSSL is installed
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if (-not $openssl) {
    Write-Host "OpenSSL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install OpenSSL first:" -ForegroundColor Yellow
    Write-Host "  Option 1: Install via Chocolatey - choco install openssl"
    Write-Host "  Option 2: Download from https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "  Option 3: Use Git Bash (comes with OpenSSL) - Run: bash generate-ssl-cert.sh"
    Write-Host ""
    exit 1
}

Write-Host "OpenSSL found: $($openssl.Source)" -ForegroundColor Green
Write-Host ""

# Create ssl directory if it doesn't exist
$sslDir = "ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir | Out-Null
    Write-Host "Created ssl/ directory" -ForegroundColor Green
}

Write-Host "Generating SSL certificate..." -ForegroundColor Yellow
Write-Host ""

# Generate private key and certificate
$certConfig = @"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Grade Management System
OU = Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = 10.7.45.10
DNS.4 = 10.7.4.228
IP.1 = 127.0.0.1
IP.2 = 10.7.45.10
IP.3 = 10.7.4.228
"@

# Save config to temporary file
$configFile = "ssl-config.tmp"
$certConfig | Out-File -FilePath $configFile -Encoding ASCII

try {
    # Generate private key and certificate in one command
    & openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "$sslDir/key.pem" -out "$sslDir/cert.pem" -config $configFile 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "SSL certificate generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Certificate files created:" -ForegroundColor Cyan
        Write-Host "  - ssl/cert.pem (Certificate)" -ForegroundColor White
        Write-Host "  - ssl/key.pem  (Private Key)" -ForegroundColor White
        Write-Host ""
        Write-Host "Certificate Details:" -ForegroundColor Cyan
        Write-Host "  - Valid for: 365 days" -ForegroundColor White
        Write-Host "  - Algorithm: RSA 2048-bit" -ForegroundColor White
        Write-Host "  - Type: Self-signed (for development only)" -ForegroundColor White
        Write-Host ""
        Write-Host "Important Notes:" -ForegroundColor Yellow
        Write-Host "  1. This is a self-signed certificate for DEVELOPMENT ONLY" -ForegroundColor Yellow
        Write-Host "  2. Browsers will show a security warning (expected)" -ForegroundColor Yellow
        Write-Host "  3. For production, use a certificate from a trusted CA" -ForegroundColor Yellow
        Write-Host "  4. Never commit these certificates to version control" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Restart your server (npm run dev)" -ForegroundColor White
        Write-Host "  2. Access via https://localhost:5000" -ForegroundColor White
        Write-Host "  3. Accept the browser security warning" -ForegroundColor White
        Write-Host ""
        
        # Check if ssl/ is in .gitignore
        if (Test-Path ".gitignore") {
            $gitignore = Get-Content ".gitignore" -Raw
            if ($gitignore -notmatch "ssl/") {
                Write-Host "Adding ssl/ to .gitignore..." -ForegroundColor Yellow
                Add-Content ".gitignore" "`n# SSL Certificates`nssl/"
                Write-Host "Added ssl/ to .gitignore" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "Failed to generate certificate" -ForegroundColor Red
        Write-Host "Please check OpenSSL installation and try again" -ForegroundColor Yellow
    }
} finally {
    # Clean up temporary config file
    if (Test-Path $configFile) {
        Remove-Item $configFile
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Certificate Generation Complete" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
