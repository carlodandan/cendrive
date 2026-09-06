# CenDrive Security Documentation

## Threat Model & Security Posture

CenDrive is designed with a strong emphasis on data privacy and local security. By adopting an offline-first, desktop-only architecture, the application inherently mitigates many vectors common to web applications (e.g., cross-site scripting, remote data breaches, man-in-the-middle attacks on databases).

### 1. Data Sovereignty and Network Security
- **Local Storage:** All application data is stored in a local SQLite database (`cendrive.db`). No data is transmitted to cloud servers, databases, or third-party analytics services.
- **Update Checks Only:** The only network request made by CenDrive is an HTTPS `GET` request to GitHub to check for application updates (`latest.json`). This request contains no user data.

### 2. Application Integrity and Code Signing
CenDrive utilizes a robust, two-tiered signing process to ensure the integrity of the application:
- **Installer Signing (Authenticode):** The Windows installers (`.msi`, `.nsis`) are signed using a `.pfx` certificate via `signtool.exe`. This verifies the publisher's identity to the Windows OS (preventing SmartScreen warnings) and guarantees the installer hasn't been tampered with.
- **Auto-Updater Signing (Minisign):** The auto-updater payload is cryptographically signed using a Minisign private key. The Tauri application contains the hardcoded public key and strictly verifies the `.sig` file before applying any update. This prevents malicious updates from being installed even if the release server is compromised.

### 3. IPC (Inter-Process Communication) Security
- **Command Isolation:** The frontend UI can only communicate with the backend Rust system via predefined Tauri commands. 
- **Type Safety:** The Rust backend enforces strict type checking through `serde` structs (`RecordInput`, `FamilyMemberInput`). Any malformed or unexpected data sent over IPC is rejected at the serialization boundary before processing.
- **Content Security Policy (CSP):** The application strictly defines a CSP in `tauri.conf.json` that restricts script execution, external connections, and object loading, providing defense-in-depth against potential UI vulnerabilities.

### 4. Database Security
- **SQL Injection Prevention:** The `rusqlite` implementation heavily utilizes parameterized queries (e.g., `params![first_name, last_name]`). User input is never concatenated directly into SQL execution strings.
- **Input Sanitization:** The backend includes utility functions (e.g., `nz()`, `required()`) that trim whitespace and enforce required fields, ensuring clean data enters the database.

## Security Best Practices for Development
- **Secret Management:** Private keys (`cendrive.key`) and Code Signing Certificates (`cendrive.pfx`) are heavily gitignored. In CI/CD, these are injected exclusively via encrypted GitHub Secrets (`TAURI_SIGNING_PRIVATE_KEY`, `CERTIFICATE_BASE64`).
- **Dependency Auditing:** Dependencies in both the Rust (`Cargo.lock`) and Node (`pnpm-lock.yaml`) ecosystems should be regularly audited for known vulnerabilities.
