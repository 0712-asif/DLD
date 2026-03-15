# DLD Project — Digital Logic Learning Simulator

An interactive web application for learning **Digital Logic Design (DLD)** through hands-on simulations, 3D visualizations, and real-world application demos. Built with React + Vite and packaged as an Android app via Capacitor.

---

## Live Demo

**GitHub Repository:** https://github.com/0712-asif/DLD

---

## Features

### Core Modules (1–8)
| Module | Topic |
|--------|-------|
| 1 | Logic Gates — AND, OR, NOT, NAND, NOR, XOR, XNOR |
| 2 | Boolean Algebra & Laws |
| 3 | Karnaugh Map (K-Map) Simplification |
| 4 | Combinational Circuits — Adders, Multiplexers |
| 5 | Flip-Flops — SR, D, JK, T |
| 6 | Registers & Shift Registers |
| 7 | Counters — Ripple, Synchronous, BCD |
| 8 | Multiplexers & Demultiplexers |

### Advanced Modules (9–14)
| Module | Topic |
|--------|-------|
| 9  | Finite State Machines (FSM) |
| 10 | Sequential Circuit Analysis |
| 11 | Memory Units — RAM, ROM |
| 12 | 3D Logic Gate Visualizer (Three.js) |
| 13 | Encoders & Decoders |
| 14 | Arithmetic Logic Unit (ALU) |

### Real-World Applications (15–20)
| Module | Topic |
|--------|-------|
| 15 | Traffic Light Controller (FSM-based) |
| 16 | Digital Voting Machine |
| 17 | Smart Parking System |
| 18 | Elevator Control System |
| 19 | 4-Bit ALU Simulator |
| 20 | Binary Calculator |

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 6 | Build tool |
| TailwindCSS | 3 | Styling |
| Framer Motion | 11 | Animations |
| Three.js | 0.170 | 3D rendering |
| @react-three/fiber | 8 | React renderer for Three.js |
| @react-three/drei | 9 | Three.js helpers |
| React Router | 6 | Client-side routing |
| Capacitor | 8 | Native Android packaging |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone repository
git clone https://github.com/0712-asif/DLD.git
cd DLD

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Android APK

The project is packaged as an Android app using **Capacitor**.

### Build APK via GitHub Actions (Recommended)

A CI/CD workflow automatically builds the APK on every push:

1. Go to **[Actions tab](https://github.com/0712-asif/DLD/actions)**
2. Click the latest **"Build Android APK"** workflow run
3. Scroll to **Artifacts** section
4. Download **`DLD-Project-debug-apk`** (contains `app-debug.apk`)

### Build APK Locally

Requirements: Android Studio / Android SDK + JDK 17–21

```bash
# Build web assets and sync to Android
npm run mobile:build

# Open in Android Studio
npm run mobile:android
```

Or build via command line:

```bash
cd android
./gradlew assembleDebug
# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Project Structure

```
DLD_PROJ/
├── src/
│   ├── App.jsx                    # Root layout, navigation, routing
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global styles (Tailwind + custom)
│   └── pages/
│       ├── Module1.jsx – Module14.jsx   # Core & Advanced modules
│       ├── Module15.jsx – Module20.jsx  # Real-World Application modules
│       ├── ApplicationShell.jsx         # Shared 3-panel layout
│       └── RealWorldApplications.jsx    # Overview / landing grid
├── android/                       # Capacitor Android project
├── .github/workflows/
│   └── build-apk.yml              # GitHub Actions APK build
├── vite.config.js                 # Vite + code splitting config
├── tailwind.config.js
├── capacitor.config.json
└── package.json
```

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Build production assets to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run mobile:build` | Build + sync web assets to Android |
| `npm run mobile:sync` | Sync web assets to Android only |
| `npm run mobile:android` | Open Android project in Android Studio |

---

## App Info

- **App ID:** `com.asif.dld`
- **App Name:** DLD Project
- **Min Android SDK:** 22 (Android 5.1)

---

## License

This project was built for educational purposes as part of a Hackathon (2025–2028).
