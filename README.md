# Hemi-Sync Audio Generator

A browser-based React application that generates Hemi-Sync-style binaural beats using the Web Audio API. Inspired by the Monroe Institute and declassified CIA Gateway Process documents, the app is designed to help induce altered states of consciousness through frequency-following response (FFR) via stereo headphones.

---

## 🔊 Features

- **Preset-Based Audio**: Choose from built-in presets (Focus 10, Focus 12, Deep Relaxation, Enhanced Creativity), each tuned to specific brainwave frequencies.
- **Manual Control**: Customize left, right, and optional third carrier frequencies.
- **Volume Control**: Adjustable gain to fine-tune output.
- **Dark/Light Mode**: Toggleable UI theme for comfortable viewing.
- **Spatial Sound Panning**: Uses HRTF stereo positioning for immersive effects.

---

## 🧠 Presets (Based on CIA Documents)

- **Focus 10** — Left: 200 Hz | Right: 208 Hz | Carrier: 50 Hz
- **Focus 12** — Left: 300 Hz | Right: 310 Hz | Carrier: 60 Hz
- **Deep Relaxation** — Left: 250 Hz | Right: 254 Hz | Carrier: 40 Hz
- **Enhanced Creativity** — Left: 280 Hz | Right: 288 Hz | Carrier: None

---

## 🛠 Setup & Usage

### Requirements

- Node.js (v16+)
- npm or yarn
- A modern browser (Chrome or Firefox recommended)
- Stereo headphones (essential for binaural beat effect)

### Installation

```bash
git clone https://github.com/your-username/hemisync-audio-generator.git
cd hemisync-audio-generator
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Controls

- 🎧 Select a preset or enter frequencies manually.
- 🔊 Adjust volume (0.0 to 1.0).
- ▶️ Click **Play** to begin audio, or **Stop** to pause.
- 🌓 Use **Dark Mode** toggle for visual comfort.

---

## 📦 Technologies

- React 18 + Vite (dev server)
- Web Audio API (oscillators, gain, panners)
- JavaScript hooks for state + audio control

---

## 🪪 License

MIT License. See LICENSE for details.

---

## 🤝 Contributing

Pull requests are welcome! Add presets, improve UI/UX, or contribute audio enhancements.

---

## 📚 References

- [CIA Gateway Process PDF](https://www.cia.gov/readingroom/document/cia-rdp96-00788r001700210016-5)
- Monroe Institute Hemi-Sync principles
