#!/bin/bash
set -e

echo "🚀 Сборка Smart Calc APK..."

PROJECT_DIR="/Users/Yaroslav/Documents/Programming/Apps/calculator-app"
APK_DIR="$PROJECT_DIR/apk"
KEYSTORE="$APK_DIR/keystore.jks"
STOREPASS="smartcalc123"
KEYPASS="smartcalc123"
ALIAS="smartcalc"
ZIPALIGN=$(find /Users/Yaroslav/Library/Android/sdk/build-tools -name "zipalign" -type f | sort -V | tail -1)
APKSIGNER=$(find /Users/Yaroslav/Library/Android/sdk/build-tools -name "apksigner" -type f | sort -V | tail -1)

cd "$PROJECT_DIR"

# Сохраняем homepage
HOMEPAGE_BACKUP=$(node -p "require('./package.json').homepage" 2>/dev/null || echo "")

# Удаляем homepage для правильной сборки
if [ -n "$HOMEPAGE_BACKUP" ]; then
  echo "📝 Временно убираем homepage..."
  node -e "const p=require('./package.json'); delete p.homepage; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
fi

echo "🧹 Удаляем старую сборку..."
rm -rf build

echo "📦 Сборка React..."
npm run build

echo "🤖 Сборка Android APK..."
export NDK_HOME="/Users/Yaroslav/Library/Android/sdk/ndk/25.2.9519653"
npx tauri android build --apk

BUILD_DIR="$PROJECT_DIR/src-tauri/gen/android/app/build/outputs/apk"
UNIVERSAL_APK="$BUILD_DIR/universal/release/app-universal-release-unsigned.apk"

echo "🔐 Подпись APK..."

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
  echo "❌ APK не найден"
  exit 1
fi

# Восстанавливаем homepage ПОСЛЕ всей сборки
if [ -n "$HOMEPAGE_BACKUP" ]; then
  echo "📝 Восстанавливаем homepage..."
  node -e "const p=require('./package.json'); p.homepage='$HOMEPAGE_BACKUP'; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2))"
fi

echo ""
echo "🎉 Готово!"
ls -lh "$APK_DIR"/*.apk
