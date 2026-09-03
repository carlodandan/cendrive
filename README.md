# CenDrive
A modern, full-featured database management system designed for census-related data.

![Dashboard-CenDrive](https://img.shields.io/badge/Dashboard-CenDrive-purple) ![Tauri-2.11](https://img.shields.io/badge/Tauri-2.11-24C8D8?logo=tauri) ![Rust-2021](https://img.shields.io/badge/Rust-2021-000000?logo=rust) ![React-19.2](https://img.shields.io/badge/React-19.2-61DAFB?logo=react) ![Vite-8.2](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite) ![Tailwind_CSS-4.3](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss)
![License-MIT](https://img.shields.io/badge/License-MIT-green)

# Overview
CenDrive is a comprehensive database management system designed for census-type
data. Records live in a SQLite file on the machine that runs it; nothing is
uploaded anywhere.

![CenDrive](https://raw.githubusercontent.com/carlodandan/cendrive/refs/heads/main/images/landingpage.webp)

# Features
- Dashboard with search, pagination and expandable family details
- Data entry for a household head plus up to thirty family members
- Reports: coverage by region, province and city or municipality
- Export to CSV or Excel, and one-click database backups
- Light and dark themes that follow the operating system
- Fully offline

# Requirements
- [Node.js](https://nodejs.org) 22 or newer
- [Rust](https://rustup.rs) (stable)
- Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  and the WebView2 runtime, which Windows 11 already includes

# Development
```sh
npm install
npm run dev
```

`npm run dev` starts Vite and the Tauri shell together. `npm run typecheck`
checks the frontend on its own, and `cargo check` inside `src-tauri/` does the
same for the Rust side.

# Building
```sh
npm run build
```

The installer lands in `src-tauri/target/release/bundle/nsis/`.

## Code signing
`npm run build` reads `.env` and picks its signing mode from what it finds
there. Copy `.env.sample` to `.env` and set one of the two:

| Variable | Effect |
| --- | --- |
| `CERTIFICATE_THUMBPRINT` | Signs with that certificate from the Windows certificate store. |
| `CERTIFICATE_PASSWORD` | Signs with a `.pfx` file — `cert/cendrive.pfx` by default, or `CERTIFICATE_PATH`. |
| neither | Builds an unsigned installer. |

The thumbprint wins if both are set. `.pfx` signing goes through
`scripts/sign.cmd`, which reads the password from the environment so it stays
out of the build log.

`.env` and `cert/cendrive.pfx` are both gitignored. Leave them that way.

## Releases
A push to `prod` runs `.github/workflows/release.yml`, which builds on Windows
and publishes `v<version>` with the bundled installers attached. The tag comes
from the app version, so cutting a release means bumping it in
`src-tauri/tauri.conf.json`, `package.json` and `src-tauri/Cargo.toml`.

CI signs with two repository secrets, and without them the release still goes
out, unsigned:

| Secret | Value |
| --- | --- |
| `CERTIFICATE_BASE64` | The `.pfx`, base64 encoded. |
| `CERTIFICATE_PASSWORD` | The password protecting it. |

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert\cendrive.pfx")) | Set-Clipboard
```

# License
[MIT](LICENSE)
