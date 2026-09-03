use serde::{Serialize, Serializer};

/// Every command returns this error type. `serde` turns it into the string that
/// the frontend receives as a rejected `invoke()` promise, which `src/lib/api.ts`
/// converts back into the `{ success, data, error }` shape the hooks expect.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("File system error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Spreadsheet error: {0}")]
    Xlsx(#[from] rust_xlsxwriter::XlsxError),

    #[error("Settings error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("{0}")]
    Tauri(#[from] tauri::Error),

    #[error("No household found with id {0}")]
    NotFound(i64),

    #[error("{0}")]
    Other(String),
}

impl AppError {
    pub fn other(message: impl Into<String>) -> Self {
        Self::Other(message.into())
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
