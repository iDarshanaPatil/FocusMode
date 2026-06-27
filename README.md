# FocusMode

A macOS-first focus app — timer, distraction blocking, streaks, and a calm **Focus Sanctuary** UI. Fully local. No accounts. No cloud.

## Features

- **Focus timer** — Pomodoro presets, custom durations, countdown & count-up modes
- **App blocking** — detects when blocked apps become frontmost during a session
- **Strictness levels** — Soft (breathing pause), Medium (cooldown + intent), Hard (no early unlock)
- **Intent capture** — write why you're focusing; resurfaced on distraction attempts
- **Distraction journal** — tag what pulled you away
- **Streaks & stats** — daily goals, session history, focus score, weekly insights
- **Sanctuary themes** — Midnight, Forest, Deep Ocean
- **Menu bar tray** — quick access and 25-min focus shortcut
- **Local AI (optional)** — Ollama intent refinement when installed
- **Windows-ready** — `PlatformBlocker` trait scaffolded; Windows impl is Phase 1.5

## Tech stack

- Tauri 2 + Rust
- React 19 + TypeScript + Vite
- Tailwind CSS v3 + Framer Motion
- SQLite (local persistence)
- Zustand

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) — **required** for Tauri (provides `cargo`)

After installing Rust, restart your terminal or run:

```bash
source "$HOME/.cargo/env"
```

Verify:

```bash
cargo --version
```
- macOS 12+

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Optional: Ollama intent helper

```bash
# Install Ollama from https://ollama.com
ollama pull gemma2:2b
```

When Ollama is running, the setup screen offers **Refine with Ollama** for your focus intent.

## Keyboard shortcut

`Cmd+Shift+F` — quick start (when global shortcut plugin is enabled in settings)

## License

MIT
