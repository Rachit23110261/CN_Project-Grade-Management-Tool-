#!/bin/bash

# 🔐 SSL Certificate Generation Script (Bash)
# Generates self-signed SSL certificates for HTTPS development

echo "=================================="
echo "SSL Certificate Generator"
echo "=================================="
echo ""

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL not found!"
    echo ""
    echo "Please install OpenSSL first:"
    echo "  Ubuntu/Debian: sudo apt-get install openssl"
    echo "  MacOS: brew install openssl"
    echo "  Windows: Use generate-ssl-cert.ps1 instead"
    echo ""
    exit 1
fi

echo "✅ OpenSSL found: $(which openssl)"
echo ""

# Create ssl directory if it doesn't exist
if [ ! -d "ssl" ]; then
    mkdir ssl
    echo "📁 Created ssl/ directory"
fi

echo "🔐 Generating SSL certificate..."
echo ""

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Grade Management System/OU=Development/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,DNS:10.7.45.10,IP:127.0.0.1,IP:10.7.45.10" \
    2>&1 > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate generated successfully!"
    echo ""
    echo "📄 Certificate files created:"
    echo "  - ssl/cert.pem (Certificate)"
    echo "  - ssl/key.pem  (Private Key)"
    echo ""
    echo "📋 Certificate Details:"
    echo "  - Valid for: 365 days"
    echo "  - Algorithm: RSA 2048-bit"
    echo "  - Type: Self-signed (for development only)"
    echo ""
    echo "⚠️  Important Notes:"
    echo "  1. This is a self-signed certificate for DEVELOPMENT ONLY"
    echo "  2. Browsers will show a security warning (expected)"
    echo "  3. For production, use a certificate from a trusted CA"
    echo "  4. Never commit these certificates to version control"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Restart your server (npm run dev)"
    echo "  2. Access via https://localhost:5000"
    echo "  3. Accept the browser security warning"
    echo ""
    
    # Check if ssl/ is in .gitignore
    if [ -f ".gitignore" ]; then
        if ! grep -q "ssl/" .gitignore; then
            echo "⚠️  Adding ssl/ to .gitignore..."
            echo -e "\n# SSL Certificates\nssl/" >> .gitignore
            echo "✅ Added ssl/ to .gitignore"
        fi
    fi
else
    echo "❌ Failed to generate certificate"
    echo "Please check OpenSSL installation and try again"
    exit 1
fi

echo ""
echo "=================================="
echo "Certificate Generation Complete"
echo "=================================="
