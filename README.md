# 🧮 Smart Calculator

Multi-functional calculator with converter, timer and currency exchange.

## 📱 Screens

### 🧮 Calculator
- **Normal**: +, −, ×, ÷, √, x², %, |x|, n!
- **Scientific**: sin, cos, tan, log, ln, π, e, xʸ, ³√, asin, acos, atan, eˣ, 1/x
- **Programmer**: DEC, BIN, OCT, HEX + AND, OR, NOT, XOR, <<, >>

### 🔄 Converter
7 types: length, weight, time, temperature, speed, area, volume.

### ⏰ Timer
Time difference between two dates.

### 💱 Currency
20 currencies, rate chart, 4 timeframes.

### ⚙️ Settings
- Language: Russian / English (auto)
- Theme: ☀️ Light / 🌙 Dark / 🔄 Auto

## 🚀 Run

```bash
cd calculator-app
npm install
npm start
```

## 📦 Build

```bash
npm run build
serve -s build -l 3000
```

## 🌐 Deploy

```bash
npx vercel
```

## 📱 Android App

See [PWA_INSTALL.md](PWA_INSTALL.md) or use **Capacitor**:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npm run build
npx cap copy android
npx cap open android
```

## 👨‍💻 Author

**Yarik Studio**

## 📄 License

MIT
