# 🧮 Smart Calculator

Multi-functional calculator with **Tauri v2** Android build, including calculator, converter, timer, currency exchange, and settings.

## ✨ Features

### 🧮 Calculator
- **Normal mode**: +, −, ×, ÷, √, x², π, e, n!, mod (remainder)
- **Scientific mode**: sin, cos, tan, ctg, log, ln, asin, acos, atan, atg, π, e, x!, |x|, 1/x, % of, 10ˣ
- **Programmer mode**: DEC, BIN, OCT, HEX + AND, OR, XOR, NOT, <<, >>

### 🔄 Converter
Unit converter for: length, weight, time, temperature, speed, area, volume.

### ⏰ Timer
Countdown to special dates: New Year, Christmas (Catholic/Orthodox), Halloween.

### 💱 Currency
15 currencies with offline fallback rates and swap functionality.

### ⚙️ Settings
- **Language**: English / Русский (auto-detect)
- **Theme**: ☀️ Light / 🌙 Dark / 🔄 Auto (system preference)
- **Android download**: Available for web users only (hidden in Tauri app)

## 🚀 Quick Start

```bash
cd calculator-app
npm install
npm start
```

## 📦 Build for Production

```bash
npm run build
```

## 🌐 Deploy to GitHub Pages

```bash
npm run deploy
```

## 🤖 Build Android APK

```bash
bash build-apk.sh
```

Output: `apk/SmartCalc.apk` (~32 MB)

### Prerequisites
- Android SDK with NDK 25.2.9519653
- Java Development Kit (JDK)
- Keystore at `apk/keystore.jks` (password: `smartcalc123`)

## 📱 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Mobile**: Tauri v2 (Android)
- **Styling**: Custom CSS (no frameworks)
- **Build**: Create React App

## 📁 Project Structure

```
calculator-app/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks (useCalculator, useConverter, etc.)
│   ├── constants/       # Translations (RU/EN)
│   ├── types/           # TypeScript types
│   └── App.css          # Global styles
├── src-tauri/           # Tauri backend (Rust)
│   ├── gen/android/     # Generated Android project
│   └── Cargo.toml       # Rust dependencies
├── apk/                 # Built APK files (gitignored)
├── public/              # Static assets
└── package.json         # Node.js dependencies
```

## 🎨 UI Features

- Responsive design (mobile-first)
- Smooth animations (swap button, transitions)
- Touch-friendly buttons
- No tap highlight on Android
- Dark/Light theme support
- Local history (last 10 calculations)

## 🧮 Calculator Logic

| Mode | Special Features |
|------|-----------------|
| Normal | π and e insert as symbols (evaluate on =), mod = remainder |
| Scientific | % of = percentage calculation, 10ˣ, trigonometric functions in degrees |
| Programmer | Bitwise operators as binary (AND, OR, XOR), NOT unary, base highlighting |

## 👨‍💻 Author

**Yarik Studio**

## 📄 License

MIT

## 🙏 Acknowledgments

- **Tauri**: Cross-platform desktop & mobile framework
- **React**: UI library
- **GitHub Actions**: CI/CD (optional)
