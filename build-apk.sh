#!/bin/bash
set -e

echo "🚀 Building Smart Calc APK..."

PROJECT_DIR="/Users/Yaroslav/Documents/Programming/Apps/calculator-app"
APK_DIR="$PROJECT_DIR/apk"
KEYSTORE="$APK_DIR/keystore.jks"
STOREPASS="smartcalc123"
KEYPASS="smartcalc123"
ALIAS="smartcalc"
ZIPALIGN=$(find /Users/Yaroslav/Library/Android/sdk/build-tools -name "zipalign" -type f | sort -V | tail -1)
APKSIGNER=$(find /Users/Yaroslav/Library/Android/sdk/build-tools -name "apksigner" -type f | sort -V | tail -1)

cd "$PROJECT_DIR"

# Save homepage from package.json
HOMEPAGE_BACKUP=$(node -p "require('./package.json').homepage" 2>/dev/null || echo "")

# Remove homepage for correct asset paths
if [ -n "$HOMEPAGE_BACKUP" ]; then
  echo "📝 Temporarily removing homepage..."
  node -e "const p=require('./package.json'); delete p.homepage; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
fi

echo "🧹 Cleaning old build..."
rm -rf build

echo "📦 Building React app..."
npm run build

echo "🤖 Building Android APK..."
export NDK_HOME="/Users/Yaroslav/Library/Android/sdk/ndk/25.2.9519653"
npx tauri android build --apk

BUILD_DIR="$PROJECT_DIR/src-tauri/gen/android/app/build/outputs/apk"
UNIVERSAL_APK="$BUILD_DIR/universal/release/app-universal-release-unsigned.apk"

echo "🔐 Signing APK..."

if [ -f "$UNIVERSAL_APK" ]; then
  rm -f "$APK_DIR"/*.apk
  ALIGNED_APK="$APK_DIR/app-aligned.apk"
  "$ZIPALIGN" -f -v 4 "$UNIVERSAL_APK" "$ALIGNED_APK"
  SIGNED_APK="$APK_DIR/SmartCalc.apk"
  "$APKSIGNER" sign --ks "$KEYSTORE" --ks-pass pass:"$STOREPASS" --key-pass pass:"$KEYPASS" --v2-signing-enabled true --out "$SIGNED_APK" "$ALIGNED_APK"
  "$APKSIGNER" verify -v "$SIGNED_APK"
  rm -f "$ALIGNED_APK"
  echo "✅ APK: $SIGNED_APK"
else
  echo "❌ APK not found"
  exit 1
fi

# Restore homepage after build
if [ -n "$HOMEPAGE_BACKUP" ]; then
  echo "📝 Restoring homepage..."
  node -e "const p=require('./package.json'); p.homepage='$HOMEPAGE_BACKUP'; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
fi

echo ""
echo "🎉 Done!"
ls -lh "$APK_DIR"/*.apk
