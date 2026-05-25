# Butia v4 MakeCode Extension

> A MakeCode extension for the [micro:bit](https://microbit.org/) platform that brings the **Butia v4 educational robotics kit** into the classroom — enabling students to program real robots using drag-and-drop blocks, with no prior coding experience required.

[![MakeCode](https://img.shields.io/badge/MakeCode-micro%3Abit-blue)](https://makecode.microbit.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Workflow](#development-workflow)
- [Using the Extension in MakeCode](#using-the-extension-via-github-stable)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Thesis Team](#thesis-team)

---

## Overview

Butia v4 is an **open-source educational robotics platform** aimed at introducing programming and computational thinking to students of all ages. This repository provides a custom [MakeCode](https://makecode.microbit.org/) extension that exposes Butia v4 hardware capabilities — motors, sensors, and actuators — as intuitive visual blocks in the MakeCode block editor.

Built on top of [Microsoft PXT](https://github.com/microsoft/pxt), the extension is designed to lower the barrier to entry for robotics education: teachers can integrate it directly into existing MakeCode projects without any additional tooling, and students can start programming their robots within minutes.

> **Note:** This extension is being developed as part of a Computer Engineering thesis at the Faculty of Engineering, Universidad de la República (Uruguay). The block API may evolve between versions during active development.

---

## Prerequisites

Before getting started, ensure the following tools are installed on your system:

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | v24.15.0 | [nodejs.org](https://nodejs.org/) — earlier versions may not work |
| npm | bundled with Node.js | Used to install dev dependencies |
| PXT CLI | latest | Install via `npm install -g pxt` |
| Git | any | [git-scm.com](https://git-scm.com/) |

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/bruaguspons993/butia-prueba.git
cd butia-prueba
```

### 2. Install npm dependencies

```bash
npm install
```

This installs dev tools (TypeScript, ESLint, pxt-microbit) and automatically creates `node_modules/pxtcli.json`, which the `pxt` CLI needs to locate its runtime. Without this step, all `pxt` commands will fail.

---

## Development Workflow

The recommended cycle for developing and testing changes:

### Build

```bash
npm run build
```

Compiles all TypeScript sources and produces a flashable binary at `built/binary.hex`.

### Test

```bash
npm test
```

Runs the test suite in `test.ts`. Tests are excluded from the extension build — they only run via this command.

### Type check

```bash
npm run typecheck
```

Validates TypeScript types without producing any files. Useful for catching errors before building.

### Lint

```bash
npm run lint
```

### Sync file manifest

```bash
npm run sync
# or: bun scripts/sync-pxt.ts
# or: npx tsx scripts/sync-pxt.ts
```

Scans `src/` and `test/` and updates the file lists in `pxt.json` automatically. Run this after adding, renaming, or deleting any `.ts` file — otherwise PXT won't pick up the change.

### Flash to micro:bit

```bash
npm run deploy
```

Requires a micro:bit connected via USB.

### Clean

```bash
make clean
```

---

### Load the built extension in MakeCode

After `npm run build`:

1. Go to [https://makecode.microbit.org/](https://makecode.microbit.org/) and create a **New Project**
2. Click **Extensions** → **Import File**
3. Upload `built/binary.hex`

The Butia v4 blocks will appear in the block palette immediately.

> **Tip:** After each code change, run `npm run build` and re-import the `.hex` file to pick up your updates.

---

## Using the Extension via GitHub (Stable)

For classroom use or when you just want to use the extension without building from source:

1. Open [https://makecode.microbit.org/](https://makecode.microbit.org/)
2. Click **New Project**
3. Go to ⚙ → **Extensions**
4. Search for or paste:
   ```
   https://github.com/bruaguspons993/butia-prueba
   ```
5. Click **Import**

The extension is now ready to use in your project.

---

## Project Structure

```
butia-prueba/
├── src/
│   ├── main.ts                     # Runtime entry point
│   ├── types/
│   │   ├── enums.d.ts              # Ambient const enum declarations (TurnDirection, LineSensorId, RobotAssist, ButiaEvent)
│   │   ├── components.d.ts         # Component interface hierarchy (IRobotComponent → IMotorDriver, ILineSensor, IDistanceSensor)
│   │   └── robot.d.ts              # IRobot interface
│   ├── core/
│   │   ├── constants.ts            # Value constants (POLL_INTERVAL_MS, LINE_THRESHOLD, OBSTACLE_STOP_DISTANCE_CM, BUTIA_EVENT_SOURCE, MAX_DISTANCE_CM)
│   │   └── robot-base.ts           # RobotBase no-op class (PXT abstract workaround)
│   ├── hardware/
│   │   ├── butia-robot.ts          # ButiaRobot — concrete hardware implementation
│   │   ├── i2c-motor-driver.ts     # I2CMotorDriver — I2C motor controller
│   │   ├── analog-line-sensor.ts   # AnalogLineSensor — analog line detection
│   │   └── sr04-distance-sensor.ts # SR04DistanceSensor — HC-SR04 ultrasonic sensor
│   └── blocks/
│       ├── imperative.ts           # Imperative (sequential) block API
│       └── events.ts               # Event-based (reactive) block API
├── test/                           # Unit tests (excluded from extension build)
│   ├── robot.test.ts
│   ├── imperative.test.ts
│   ├── events.test.ts
│   └── sensor.test.ts
├── scripts/
│   └── sync-pxt.ts                 # Syncs src/ and test/ file lists into pxt.json
├── pxt.json                        # PXT extension manifest
├── package.json                    # npm metadata and dev scripts
├── tsconfig.json                   # TypeScript compiler configuration
├── built/                          # Compiled output — do not edit manually
│   └── binary.hex                  # Flashable micro:bit binary
└── README.md
```

---

## Troubleshooting

### Blocks do not appear after importing the `.hex`

Make sure `pxt build` completed without errors. A build with TypeScript compilation errors may still produce a `.hex` that loads without exposing any blocks. Review the terminal output for error details before re-importing.

---

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue before submitting a pull request to align on the proposed change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Thesis Team

Developed as part of a Computer Engineering thesis at the **Faculty of Engineering, Universidad de la República, Uruguay**.

| Name | GitHub | LinkedIn |
|------|--------|----------|
| Bryan Salamone | [@IngBryan](https://github.com/IngBryan) | [linkedin](https://uy.linkedin.com/in/bryan-salamone-ab65401b3) |
| Mayte Carro | [@mayyte](https://github.com/mayyte) | [linkedin](https://www.linkedin.com/in/mayte-carro-valle-475705290/) |
| Bruno Pons | [@bruaguspons](https://github.com/bruaguspons) | [linkedin](https://www.linkedin.com/in/brunopons/) |

---

### Metadata (used for MakeCode search and GitHub Pages rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>