<br>
<p align="center">
<img src="./src-tauri/icons/icon.png" alt="Pulse" height="150" width="150"/>
</a>
</p>

# 📩 Pulse

![GitHub Release](https://img.shields.io/github/v/release/YiweiShen/pulse-app)
![GitHub Release Date](https://img.shields.io/github/release-date/YiweiShen/pulse-app)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/YiweiShen/pulse-app/tauri.yml)
![GitHub top language](https://img.shields.io/github/languages/top/YiweiShen/pulse-app)
![GitHub last commit](https://img.shields.io/github/last-commit/YiweiShen/pulse-app)

A minimalist macOS menubar app for email notifications.

### 🍺 Install with Homebrew

Run the following command:

```bash
brew install yiweishen/tap/pulse
```

### 🛠️ Development

To run the app locally, you need to have [Rust](https://www.rust-lang.org/tools/install) and [Node.js](https://nodejs.org/en/download/) installed. Clone the repository and run:

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

To release a new version, make sure you don't have any uncommitted changes, and then:

```bash
npm run release
```

### 🔏 OS Sign

You may need to sign the application before running it.

```bash
chmod +x /Applications/Pulse.app && \
xattr -cr /Applications/Pulse.app && \
codesign --force --deep --sign - /Applications/Pulse.app
```

### 🔐 Gmail Setup

1. (Recommended) Go to Google Account - [App Passwords](https://myaccount.google.com/apppasswords)
2. Follow the prompts to generate a unique password.
3. Sign in the Pulse app with your Google account name and the generated password.

Learn more: https://support.google.com/accounts/answer/185833?hl=en

### 📌 To Do

- Implement a native window menu using the [Tauri window menu feature](https://v2.tauri.app/learn/window-menu/).
- Extend support to other operating systems, including Windows and Linux, for broader compatibility.
- Integrate support for more email services such as Outlook, Yahoo, and others.
- Allow users to manage and switch between multiple accounts within the app.
- Enable users to create and apply custom configurations for more flexibility.

### ⚠️ Work in Progress

Pulse is an experimental weekend project built to explore Rust and Tauri. As such, it's not production-ready:

- Use at your own risk.
- Expect breaking changes and frequent updates.
