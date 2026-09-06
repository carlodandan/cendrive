# CenDrive
A modern, full-featured database management system designed for census-related data.

![Dashboard-CenDrive](https://img.shields.io/badge/Dashboard-CenDrive-purple) ![Tauri-2.11](https://img.shields.io/badge/Tauri-2.11-24C8D8?logo=tauri) ![Rust-2021](https://img.shields.io/badge/Rust-2021-000000?logo=rust) ![React-19.2](https://img.shields.io/badge/React-19.2-61DAFB?logo=react) ![Vite-8.2](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite) ![Tailwind_CSS-4.3](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss)
![License-MIT](https://img.shields.io/badge/License-MIT-green)

## Overview
CenDrive is a comprehensive desktop database management system designed for census-type data. Records live securely in a local SQLite database on the machine that runs it; nothing is uploaded to the cloud, ensuring absolute data privacy.

The current setup is heavily optimized and based on **Philippine demographic data**. The application incorporates standard Philippine geographic hierarchies (Regions, Provinces, Cities/Municipalities, Barangays) out of the box. This geographic data is sourced from `src/data` and processed by utility scripts located in the `scripts` directory (e.g., `region_format.py`).

![CenDrive](https://raw.githubusercontent.com/carlodandan/cendrive/refs/heads/main/images/landingpage.webp)

## Documentation
Comprehensive technical documentation is available in the `docs/` directory:
- [Architecture Overview](docs/ARCHITECTURE.md) - Details on the Tauri React/Rust stack and IPC bridge.
- [Product Vision](docs/PRODUCT.md) - Target audience, core features, and Philippine context.
- [Security Posture](docs/SECURITY.md) - Threat models, code signing, and local-first data privacy.
- [Database Schema](docs/DATABASE.md) - SQLite schema definitions, WAL mode, and backups.
- [GitHub Workflow](docs/GITHUB_WORKFLOW.md) - CI/CD pipeline, artifact generation, and deployment process.

## Key Features
- **Dashboard & Search:** Real-time search, pagination, and expandable family details.
- **Data Entry:** Capture a household head plus up to thirty family members, utilizing built-in Philippine regional data.
- **Reporting:** Export coverage analytics by region, province, and city to CSV or Excel (`.xlsx`).
- **Data Sovereignty:** Offline-first architecture. Records never leave the machine.
- **Auto-Updates:** Updates itself securely from signed GitHub releases.
- **Theming:** Light and dark modes synced with the operating system.

## Requirements
- [Node.js](https://nodejs.org) 22 or newer
- [pnpm](https://pnpm.io) 11 — `corepack enable pnpm` uses the version pinned in `package.json`; `npm install -g pnpm` works as well
- [Rust](https://rustup.rs) (stable)
- Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and the WebView2 runtime, which Windows 11 already includes.

## Development Setup
```sh
pnpm install
pnpm dev
```

`pnpm dev` starts Vite and the Tauri shell together. `pnpm typecheck` checks the frontend on its own, and `cargo check` inside `src-tauri/` does the same for the Rust side.

`pnpm-workspace.yaml` sits next to the lockfile and is committed with it. There is no workspace here: pnpm 11 keeps its supply-chain settings in that file.

## Building and Packaging
```sh
pnpm icons
pnpm build
```

`pnpm icons` generates `src-tauri/icons/` from `icons/cendrive_512x512.png`. Run it once after a fresh clone.
The installers land in `src-tauri/target/release/bundle/`, under `nsis/` and `msi/`.

### Code Signing
This is the certificate Windows checks before it will run the installer; it lives in `cert/` and has nothing to do with the updater key below. `pnpm build` reads `.env` to determine the signing mode. Copy `.env.sample` to `.env` and set one of the two:

| Variable | Effect |
| --- | --- |
| `CERTIFICATE_THUMBPRINT` | Signs with that certificate from the Windows certificate store. |
| `CERTIFICATE_PASSWORD` | Signs with a `.pfx` file — `cert/cendrive.pfx` by default, or `CERTIFICATE_PATH`. |
| neither | Builds an unsigned installer. |

### Updates and Minisign
CenDrive checks GitHub releases for a newer installer shortly after it starts. The request is a plain HTTPS fetch of `latest.json` — nothing about the records is sent.

An update is installed only if it carries a signature from the key that matches `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`. That key pair lives in `signkey/` and is a separate thing from the `.pfx` certificate.

Generate the updater pair once:
```sh
pnpm tauri signer generate -w signkey/cendrive.key
```

The public half is printed alongside the file: paste it into `plugins.updater.pubkey` and commit it. The private half belongs in `.env` locally and in repository secrets for CI.

### Releases
A push to `prod` runs `.github/workflows/release.yml`, building on Windows and publishing `v<version>`. 

CI reads four repository secrets for dual-signing:
| Secret | Value |
| --- | --- |
| `CERTIFICATE_BASE64` | The `.pfx` from `cert/`, base64 encoded. |
| `CERTIFICATE_PASSWORD` | The password protecting it. |
| `TAURI_SIGNING_PRIVATE_KEY` | The updater private key from `signkey/`. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Its password (add it empty if the key has none). |

## License
[MIT](LICENSE)

