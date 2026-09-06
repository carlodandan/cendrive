# CenDrive Architecture Documentation

## System Overview

CenDrive is a desktop application built using the Tauri framework (v2). It employs a decoupled architecture where a modern web frontend communicates with a high-performance native Rust backend. 

### Core Technologies
- **Frontend Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4
- **Backend Framework:** Tauri 2 (Rust)
- **Database:** SQLite 3 (via `rusqlite`)

## Application Layers

### 1. The Frontend (React/Vite)
The frontend is built as a Single Page Application (SPA). It acts purely as the presentation and interaction layer. 
- **Routing:** Handled by `react-router-dom` for navigation between Dashboard, Data Entry, Reports, and Settings.
- **State & Data Fetching:** Built with custom React hooks (`useDatabase`, `useSettings`, `useUpdater`) that wrap Tauri IPC (Inter-Process Communication) calls. 
- **Icons:** Uses `lucide-react` for consistent SVG iconography.

### 2. The Bridge (Tauri IPC)
Communication between the frontend and backend is handled via Tauri's IPC message passing. The frontend invokes Rust functions asynchronously, ensuring the UI thread is never blocked during heavy database operations or file I/O.
- Example: `invoke('save_record', { input })`

### 3. The Backend (Rust)
The Rust backend is responsible for all heavy lifting, system-level access, and data persistence.
- **`main.rs` & `lib.rs`:** Entry points. Initializes the Tauri application, registers plugins (dialog, opener, process, updater), sets up database connections, and registers command handlers.
- **`commands.rs`:** Defines all the callable IPC commands (e.g., `save_record`, `get_statistics`, `backup_database`).
- **`db.rs`:** Handles all direct SQLite database interactions, schema creation, and transaction management.
- **`models.rs`:** Defines the Rust data structs and their serialization/deserialization logic using `serde`.
- **`settings.rs`:** Manages reading/writing of user preferences to a local `settings.json` file.
- **`excel.rs`:** Logic for exporting database records into an `.xlsx` format (via `rust_xlsxwriter`).

## Data Flow Architecture

1. **User Input:** User fills out a form in the React frontend.
2. **IPC Call:** A custom hook sends the JSON payload to the Rust backend via Tauri's `invoke` command.
3. **Data Validation/Parsing:** Rust deserializes the JSON into strict structs (`RecordInput`, `FamilyMemberInput`).
4. **Database Transaction:** `db.rs` begins an SQLite transaction, executes the prepared statements (protecting against SQL injection), and commits.
5. **Response:** Rust returns an `AppResult` indicating success or failure, which the React hook processes to update UI state or display a toast notification.

## Build and Release Architecture

The build process is heavily automated using GitHub Actions.
- **Development:** `pnpm dev` launches Vite and the Tauri watcher concurrently.
- **Production Build:** A custom `tauri-build.mjs` script wraps the Tauri build process to handle code signing logic dynamically based on environment variables.
- **Releases:** The `.github/workflows/release.yml` triggers on pushes to the `prod` branch, compiling both `.msi` and `.nsis` installers and signing them with an injected code signing certificate and Minisign key (for the auto-updater).
