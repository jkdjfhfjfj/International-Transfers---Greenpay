#!/bin/bash
# GreenPay Android APK Build Script
# Automates the full build process

set -e

echo "🚀 GreenPay Android APK Builder"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
KEYSTORE_FILE="release.keystore"
KEY_ALIAS="greenpay-key"
BUILD_TYPE="${1:-debug}"  # debug or release

# Functions
function print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function print_error() {
    echo -e "${RED}❌ $1${NC}"
}

function print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

function print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install Node.js"
    exit 1
fi

if ! command -v java &> /dev/null; then
    print_error "Java not found. Please install JDK 11+"
    exit 1
fi

# Build web app
print_step "Building web application..."
cd client
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Web app built"
else
    print_error "Web app build failed"
    exit 1
fi
cd ..

# Sync to Android
print_step "Syncing to Android project..."
npx cap sync android > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Synced to Android"
else
    print_error "Android sync failed"
    exit 1
fi

# Build APK
cd android

if [ "$BUILD_TYPE" == "release" ]; then
    # Release build requires signing
    print_step "Building release APK..."
    
    if [ ! -f "../$KEYSTORE_FILE" ]; then
        print_warning "Release keystore not found. Use debug build:"
        print_warning "  ./build-apk.sh debug"
        exit 1
    fi
    
    # Read credentials
    read -sp "Keystore password: " KEYSTORE_PASSWORD
    echo
    read -sp "Key password: " KEY_PASSWORD
    echo
    
    # Build
    ./gradlew clean assembleRelease \
        --no-daemon \
        -Pandroid.injected.signing.store.file="../$KEYSTORE_FILE" \
        -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
        -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
        -Pandroid.injected.signing.key.password="$KEY_PASSWORD" 2>&1 | tail -20
    
    if [ $? -eq 0 ]; then
        print_success "Release APK built"
        echo ""
        echo "📦 Output:"
        ls -lh app/build/outputs/apk/release/app-release.apk
        echo ""
        echo "📝 Next steps:"
        echo "  1. Download: app/build/outputs/apk/release/app-release.apk"
        echo "  2. Distribute via Play Store or direct installation"
    else
        print_error "Release APK build failed"
        exit 1
    fi
    
else
    # Debug build (no signing required)
    print_step "Building debug APK..."
    ./gradlew clean assembleDebug --no-daemon 2>&1 | tail -20
    
    if [ $? -eq 0 ]; then
        print_success "Debug APK built"
        echo ""
        echo "📦 Output:"
        ls -lh app/build/outputs/apk/debug/app-debug.apk
        echo ""
        echo "📝 Next steps:"
        echo "  1. Install on device: adb install app/build/outputs/apk/debug/app-debug.apk"
        echo "  2. Or use Android Studio to run"
    else
        print_error "Debug APK build failed"
        exit 1
    fi
fi

cd ..

print_success "Build complete!"
echo ""
echo "Build Summary:"
echo "  Type: $BUILD_TYPE"
echo "  Package: com.greenpay.mobile"
echo "  Version: Check android/app/build.gradle"
echo ""
