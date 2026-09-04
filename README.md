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
- Updates itself from its own signed GitHub releases
- Offline otherwise: the records never leave the machine

# Requirements
- [Node.js](https://nodejs.org) 22 or newer
- [pnpm](https://pnpm.io) 11 — `corepack enable pnpm` uses the version pinned in
  `package.json`; `npm install -g pnpm` works as well
- [Rust](https://rustup.rs) (stable)
- Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  and the WebView2 runtime, which Windows 11 already includes

# Development
```sh
pnpm install
pnpm dev
```

`pnpm dev` starts Vite and the Tauri shell together. `pnpm typecheck` checks the
frontend on its own, and `cargo check` inside `src-tauri/` does the same for the
Rust side.

`pnpm-workspace.yaml` sits next to the lockfile and is committed with it. There
is no workspace here: pnpm 11 keeps its supply-chain settings in that file, and
what it holds is the two packages that were younger than pnpm's default minimum
release age on the day the lockfile was written, allowed by name.

# Building
```sh
pnpm icons
pnpm build
```

`pnpm icons` generates `src-tauri/icons/` from `icons/cendrive_512x512.png`. The
folder is gitignored, so run it once after a fresh clone and skip it afterwards;
the release workflow runs it on every build. The installers land in
`src-tauri/target/release/bundle/`, one under `nsis/` and one under `msi/`.

## Code signing
This is the certificate Windows checks before it will run the installer; it lives
in `cert/` and has nothing to do with the updater key below. `pnpm build` reads
`.env` and picks its signing mode from what it finds there. Copy `.env.sample` to
`.env` and set one of the two:

| Variable | Effect |
| --- | --- |
| `CERTIFICATE_THUMBPRINT` | Signs with that certificate from the Windows certificate store. |
| `CERTIFICATE_PASSWORD` | Signs with a `.pfx` file — `cert/cendrive.pfx` by default, or `CERTIFICATE_PATH`. |
| neither | Builds an unsigned installer. |

The thumbprint wins if both are set. `.pfx` signing goes through
`scripts/sign.cmd`, which reads the password from the environment so it stays
out of the build log.

`.env` is gitignored, and so is everything in `cert/` except the samples. Leave
it that way.

## Updates
CenDrive asks its own GitHub releases for a newer installer shortly after it
starts, and says so only when one is waiting; Settings reports every check in
full and holds the install button. The request is a plain HTTPS fetch of
`latest.json` — nothing about the records is sent anywhere.

An update is installed only if it carries a signature from the key that matches
`plugins.updater.pubkey` in `src-tauri/tauri.conf.json`. That key pair lives in
`signkey/` and is a separate thing from the certificate above: this one signs the
manifest CenDrive checks, the certificate signs the installer Windows checks.
Generate the pair once:

```sh
pnpm tauri signer generate -w signkey/cendrive.key
```

The public half is printed alongside the file: paste it into
`plugins.updater.pubkey` and commit it, since that is the half meant to ship. The
private half and its password belong in `.env` locally and in the repository
secrets for CI, never in a commit — `signkey/` is gitignored apart from its
samples.

`bundle.createUpdaterArtifacts` is on, so the private key is not optional:
without `TAURI_SIGNING_PRIVATE_KEY` in the environment the bundler stops instead
of publishing a release that nothing can update to.

## Releases
A push to `prod` runs `.github/workflows/release.yml`, which builds on Windows
and publishes `v<version>` with the bundled installers attached. The tag comes
from the app version, so cutting a release means bumping it in
`src-tauri/tauri.conf.json`, `package.json` and `src-tauri/Cargo.toml`.

CI reads four repository secrets, two for each kind of signing:

| Secret | Value |
| --- | --- |
| `CERTIFICATE_BASE64` | The `.pfx` from `cert/`, base64 encoded. |
| `CERTIFICATE_PASSWORD` | The password protecting it. |
| `TAURI_SIGNING_PRIVATE_KEY` | The updater private key from `signkey/`, contents and all. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Its password. Add it empty if the key has none. |

The certificate pair is read as one: with either half absent the installer is
unsigned and the release still goes out. The updater key is the one that cannot
be skipped, since the bundler signs what it publishes with it.

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert\cendrive.pfx")) | Set-Clipboard
Get-Content signkey\cendrive.key -Raw | Set-Clipboard
```

# License
[MIT](LICENSE)
