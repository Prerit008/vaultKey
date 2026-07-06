


# **VaultKey** <img src="https://avatars.githubusercontent.com/u/80686842?v=4" width="45" align="right" alt="Prerit Agarwal">

**A local-first, zero-knowledge password manager.**

VaultKey is a highly secure, self-hosted password manager that puts you in complete control of your data. Built with a zero-knowledge architecture, all cryptographic operations happen entirely within your browser. Your server only ever stores an opaque, encrypted blob—meaning your passwords are safe even if the server is compromised.


[![Live UI](https://img.shields.io/badge/Live%20UI-Visit%20Frontend-red?style=for-the-badge)](https://vaultkey-green.vercel.app/)
---

## 🔒 Security First

*   **True Zero-Knowledge:** Your master password never leaves your browser. Encryption and decryption are performed client-side using `AES-256-GCM`.
*   **Strong Key Derivation:** Keys are derived using `PBKDF2-SHA256` with 310,000 iterations and a unique cryptographic salt per vault.
*   **Local-First Storage:** Data is stored locally on your machine in a flat file. No third-party clouds, no subscriptions.
*   **Auto-Lock:** The vault automatically locks after 5 minutes of idle time.

## ✨ Features

*   **Browser Import:** Easily migrate from Google Chrome, Brave, or Microsoft Edge by importing your passwords via CSV.
*   **2FA / TOTP Support:** Built-in support for generating Two-Factor Authentication codes.
*   **Backup & Restore:** Export your encrypted `.vault` file to safely back up your data anywhere. Import it back to restore or migrate your vault.
*   **Modern UI:** A beautiful, responsive interface built with React and Tailwind CSS, featuring search, filtering, and a sleek dark mode.

## 🚀 Getting Started

VaultKey works seamlessly across macOS, Linux, and Windows. It requires **Python 3** and **Node.js/npm** to be installed on your system.

### macOS & Linux

**Installation:**
```bash
cd macos
chmod +x install.sh start.sh stop.sh
./install.sh
```

**Running VaultKey:**
```bash
./start.sh
```
The server will run in the background. Access the dashboard at `http://localhost:51888`.

**Stopping VaultKey:**
```bash
./stop.sh
```

### Windows

**Installation:**
Navigate to the `windows` directory and double-click `install.bat`. This will set up the Python virtual environment and build the frontend.

**Running VaultKey:**
Double-click `start.bat`. A background process will start, and your browser will automatically open to `http://localhost:51888`.

**Stopping VaultKey:**
Double-click `stop.bat` to safely shut down the background server.

## 🛠️ Technology Stack

*   **Frontend:** React, Tailwind CSS, Lucide Icons, Radix UI Primitives.
*   **Backend:** Python, FastAPI, Uvicorn (serving static files and providing the secure vault storage API).
*   **Cryptography:** Web Crypto API (Client-side).

## ⚠️ Disclaimer

This software is provided "as-is". While it uses standard cryptographic practices, always ensure you keep secure backups of your `.vault` file and your master password. If you lose your master password, your data cannot be recovered.
