# 🧮 Smart Calculator

Multi-functional calculator with with site and **Tauri v2** Android build, including calculator,
converter, timer, currency exchange, and settings.

Site: https://larfi44.github.io/smart-calc/

## ✨ Features

### 🧮 Calculator

- **Normal mode**: +, −, ×, ÷, mod (remainder), √, x², π, e, rnd (round),
- **Scientific mode**: sin, cos, tan, ctg, log, ln, asin, acos, atan, atg, π, e, x!, |x|, 1/x, % of,
  factorial, module and so on
- **Programmer mode**: +, -, ×, ÷, mod (remainder), Accounting systems (DEC, BIN, OCT, HEX), binary
  operations (AND, OR, XOR, NOT, <<, >>)

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
npm run start
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

Normal: +, -, \*, :, √, x², π and e insert as symbols (evaluate on =) and mod (counts remainder)
Scientific: Everything is as normal mode, but also trigonometric functions in degrees, % of =
percentage calculation 10ˣ\
Programmer: +, -, \*, :, Bitwise operators as binary (AND, OR, XOR), NOT unary, unit systems (DEC,
BIN, OCT and HEX)

## 👨‍💻 Author

Yaroslav Krasulya from **Yarik Studio** - https://larfi44.github.io/Yarik-Studio.github.io/

## ❤️ Donate

If you like my work, please consider donating to support the development:
https://pay.cloudtips.ru/p/b94e349b

## 📄 License

MIT – Allows anyone to use, copy, modify, merge, publish, distribute, sublicense, and sell this
software. The only requirement is that anyone who shares or uses the code must keep the original
copyright notice (Yaroslav Krasulya from Yarik Studio) and the full MIT license text inside the
files or documentation.

## ! Acknowledgments

- **React**: UI library
- **Tauri**: Cross-platform desktop & mobile framework
