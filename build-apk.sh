#!/bin/bash
set -e

echo "🚀 Сборка Smart Calc APK..."

# Пути
PROJECT_DIR="/Users/Yaroslav/calculator-app"
APK_DIR="$PROJECT_DIR/apk"
KEYSTORE="$APK_DIR/keystore.jks"
STOREPASS="smartcalc123"
KEYPASS="smartcalc123"
ALIAS="smartcalc"
ZIPALIGN=$(find /Users/Yaroslav/Library/Android/sdk/build-tools -name "zipalign" -type f | sort -V | tail -1)
APKSIGNER=$(find /Users/Yaroslav/Library/Android/sdk/build-tools -name "apksigner" -type f | sort -V | tail -1)

echo "📦 Сборка React к..."
cd "$PROJECT_DIR"
npm run build

echo "🤖 Сборка Android APK..."
export NDK_HOME="/Users/Yaroslav/Library/Android/sdk/ndk/25.2.9519653"
npx tauri android build --apk

# Путь к собранному APK
BUILD_DIR="$PROJECT_DIR/src-tauri/gen/android/app/build/outputs/apk"
UNIVERSAL_APK="$BUILD_DIR/universal/release/app-universal-release-unsigned.apk"

echo "🔐 Подпись APK (apksigner v2)..."

if [ -f "$UNIVERSAL_APK" ]; then
  # Удаляем старые APK
  rm -f "$APK_DIR"/*.apk
  
  # Выравнивание
  ALIGNED_APK="$APK_DIR/app-aligned.apk"
  "$ZIPALIGN" -f -v 4 "$UNIVERSAL_APK" "$ALIGNED_APK"
  
  # Подпись v2 (для Android 7.0+)
  SIGNED_APK="$APK_DIR/smart-calc.apk"
  "$APKSIGNER" sign --ks "$KEYSTORE" --ks-pass pass:"$STOREPASS" --key-pass pass:"$KEYPASS" --v2-signing-enabled true --out "$SIGNED_APK" "$ALIGNED_APK"
  
  # Проверка подписи
  echo "🔍 Проверка подписи..."
  "$APKSIGNER" verify -v "$SIGNED_APK"
  
  # Удаляем временные файлы
  rm -f "$ALIGNED_APK"
  
  echo "✅ APK: $SIGNED_APK"
  
  # Копируем в public/apk/ для скачивания через сайт
  mkdir -p "$PROJECT_DIR/public/apk"
  cp "$SIGNED_APK" "$PROJECT_DIR/public/apk/smart-calc.apk"
  echo "📁 APK скопирован в public/apk/"
else
  echo "❌ APK не найден"
  exit 1
fi

echo ""
echo "🎉 Готово!"
ls -lh "$APK_DIR"/*.apk
