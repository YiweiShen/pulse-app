<br>
<p align="center">
<img src="./src-tauri/icons/icon.png" alt="Pulse" height="150" width="150"/>
</a>
</p>

# 📩 Pulse

A lightweight menubar app that quietly checks the email inbox for you.

### 🍺 Install with Homebrew

Run the following command:

```bash
brew install yiweishen/tap/pulse
```

### 🛠️ Development

To run the app locally, you need to have [Rust](https://www.rust-lang.org/tools/install) and [Node.js](https://nodejs.org/en/download/) installed. Then, clone the repository and run the following commands:

```bash
npm install
npm run tauri dev
```

### 🚀 Build

To build the app for production, run the following command:

```bash
npm run package
```

### 📦 Release

To release a new version, manually bump the version in `src-tauri/Cargo.toml` and `tauri.conf.json`, then:

```bash
npm run release
```

This will auto update version in `package.json` and `package-lock.json`, and create a new git tag.

### ⚠️ Warning: WIP

This project is currently under active development and is not yet ready for production use.
