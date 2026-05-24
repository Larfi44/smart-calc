# 🧮 Умный Калькулятор

Многофункциональный калькулятор с конвертером, таймером и валютами.

## 📱 Экраны

### 🧮 Калькулятор
- **Обычный**: +, −, ×, ÷, √, x², %, |x|, n!
- **Научный**: sin, cos, tan, log, ln, π, e, xʸ, ³√, asin, acos, atan, eˣ, 1/x
- **Программистский**: DEC, BIN, OCT, HEX + AND, OR, NOT, XOR, <<, >>

### 🔄 Конвертер
7 типов: длина, вес, время, температура, скорость, площадь, объём.

### ⏰ Таймер
Разница между двумя датами.

### 💱 Валюта
20 валют, график курса, 4 временных периода.

### ⚙️ Настройки
- Язык: Русский / English (авто)
- Тема: ☀️ Светлая / 🌙 Тёмная / 🔄 Авто

## 🚀 Запуск

```bash
cd calculator-app
npm install
npm start
```

## 📦 Сборка

```bash
npm run build
serve -s build -l 3000
```

## 🌐 Деплой

```bash
npx vercel
```

## 📱 Android-приложение

Смотри [PWA_INSTALL.md](PWA_INSTALL.md) или используй **Capacitor**:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npm run build
npx cap copy android
npx cap open android
```

## 👨‍💻 Автор

**Yarik Studio**

## 📄 Лицензия

MIT
