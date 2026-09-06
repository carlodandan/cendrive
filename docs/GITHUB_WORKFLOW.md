# CenDrive GitHub Workflow Documentation

## Overview

CenDrive utilizes GitHub Actions for continuous integration and continuous deployment (CI/CD). The primary workflow is located at `.github/workflows/release.yml`. It is designed to automatically build, sign, and publish Windows installer artifacts (`.msi` and `.nsis`) whenever code is pushed to the `prod` branch.

## Trigger Conditions

The workflow is triggered by:
- **Push to `prod` branch:** Ensuring that only production-ready code is built and released.
- **`workflow_dispatch`:** Allows developers to trigger the release pipeline manually from the GitHub Actions tab, which is useful for retrying a failed run.

*Note on Concurrency:* The workflow employs a `concurrency` group named `release` without canceling in-progress runs. This ensures that releases are built one at a time and are never interrupted halfway, preventing orphaned tags or incomplete releases.

## Workflow Job Breakdown

The release process runs exclusively on `windows-latest` (or a specific Windows runner like `windows-2025`) because both Tauri installer generation and the `signtool.exe` utility required for Authenticode signing are Windows-specific.

### 1. Environment Setup
- **Code Checkout:** Uses `actions/checkout` to pull the repository.
- **Node & pnpm:** Installs pnpm and Node.js using `pnpm/setup`. The specific Node version and pnpm version are defined in the project's configurations (e.g., `package.json`).
- **Rust Toolchain:** Installs the stable Rust toolchain via `dtolnay/rust-toolchain`.

### 2. Dependency Caching
To significantly speed up build times (reducing compilation from tens of minutes to a few minutes), the workflow caches the following:
- Cargo registry index (`~/.cargo/registry/index`)
- Cargo registry cache (`~/.cargo/registry/cache`)
- Cargo git database (`~/.cargo/git/db`)
- Tauri build target folder (`src-tauri/target`)

### 3. Build Preparation
- **Icon Generation:** Runs `pnpm icons` to generate required Tauri application icons in `src-tauri/icons/` based on a source high-resolution image.

### 4. Code Signing Setup (Installer)
CenDrive conditionally supports signing the Windows installers to avoid SmartScreen warnings.
- The workflow reads two GitHub Secrets: `CERTIFICATE_BASE64` and `CERTIFICATE_PASSWORD`.
- If present, it writes the decoded base64 string to a physical `.pfx` file at `cert/cendrive.pfx`.
- If missing, the workflow explicitly gracefully degrades to building an *unsigned* installer, allowing releases to go out even if full signing capabilities aren't configured yet.

### 5. Build and Publish (Tauri Action)
The core compilation is handled by `tauri-apps/tauri-action`.
- **Custom Wrapper:** Instead of standard `tauri build`, the action is directed to run `node scripts/tauri-build.mjs`. This custom wrapper handles the integration of the Windows SDK `signtool.exe`.
- **Updater Key:** The environment variables `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` are passed. This is mandatory for signing the auto-updater payload (which is distinct from the `.pfx` installer signing).
- **GitHub Release:** Upon successful compilation, the action automatically creates a GitHub Release named `CenDrive v__VERSION__` (extracting the version from `tauri.conf.json`) and uploads the compiled installers and the `latest.json` updater manifest to it.

### 6. Security Cleanup
- A final `always()` step ensures that the `cert/cendrive.pfx` file is permanently deleted from the CI runner, even if the build fails. This is a critical security measure to prevent private certificate leakage.

## Required GitHub Secrets

To fully enable the CI/CD pipeline, the following Repository Secrets must be configured:

| Secret Name | Purpose | Required |
| :--- | :--- | :--- |
| `TAURI_SIGNING_PRIVATE_KEY` | Minisign private key for the auto-updater. | **Yes** |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the Minisign key. | **Yes** (leave empty if no password) |
| `CERTIFICATE_BASE64` | Code-signing certificate (Authenticode) in Base64 format. | No |
| `CERTIFICATE_PASSWORD` | Password for the `.pfx` certificate. | No (required if `BASE64` is set) |
| `GITHUB_TOKEN` | Built-in token to publish the Release. | **Yes** |
