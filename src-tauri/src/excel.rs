use std::path::Path;

use rust_xlsxwriter::{Color, Format, FormatBorder, Workbook, Worksheet};

use crate::error::AppResult;
use crate::models::{FamilyMember, Household};

/// Column labels are byte-for-byte the ones the Electron build produced, so
/// existing spreadsheets and downstream templates keep working.
const HOUSEHOLD_HEADERS: [&str; 17] = [
    "Household ID",
    "First Name",
    "Middle Name",
    "Last Name",
    "Extension",
    "House No",
    "Street",
    "Barangay",
    "Town",
    "Province",
    "Region",
    "ZIP Code",
    "Contact Number",
    "Email Address",
    "Family Members Count",
    "Created At",
    "Updated At",
];

const MEMBER_HEADERS: [&str; 7] = [
    "Member ID",
    "Household ID",
    "First Name",
    "Last Name",
    "Relationship",
    "Age",
    "Created At",
];

fn header_format() -> Format {
    Format::new()
        .set_bold()
        .set_background_color(Color::RGB(0x1F2937))
        .set_font_color(Color::RGB(0xF9FAFB))
        .set_border(FormatBorder::Thin)
        .set_border_color(Color::RGB(0x374151))
}

fn write_headers(sheet: &mut Worksheet, headers: &[&str]) -> AppResult<()> {
    let format = header_format();
    for (col, label) in headers.iter().enumerate() {
        sheet.write_string_with_format(0, col as u16, *label, &format)?;
    }
    sheet.set_freeze_panes(1, 0)?;
    Ok(())
}

fn opt(value: &Option<String>) -> &str {
    value.as_deref().unwrap_or("")
}

/// Writes both sheets to `path`. Overwrites an existing file, which is what the
/// user just confirmed in the save dialog.
pub fn write_workbook(
    path: &Path,
    households: &[Household],
    members: &[FamilyMember],
) -> AppResult<()> {
    let mut workbook = Workbook::new();

    {
        let sheet = workbook.add_worksheet();
        sheet.set_name("Households")?;
        write_headers(sheet, &HOUSEHOLD_HEADERS)?;

        for (index, h) in households.iter().enumerate() {
            let row = index as u32 + 1;
            sheet.write_number(row, 0, h.id as f64)?;
            sheet.write_string(row, 1, &h.first_name)?;
            sheet.write_string(row, 2, opt(&h.middle_name))?;
            sheet.write_string(row, 3, &h.last_name)?;
            sheet.write_string(row, 4, opt(&h.extension))?;
            sheet.write_string(row, 5, opt(&h.house_no))?;
            sheet.write_string(row, 6, opt(&h.street_name))?;
            sheet.write_string(row, 7, opt(&h.barangay))?;
            sheet.write_string(row, 8, opt(&h.town))?;
            sheet.write_string(row, 9, opt(&h.province))?;
            sheet.write_string(row, 10, opt(&h.region))?;
            sheet.write_string(row, 11, opt(&h.zip_code))?;
            sheet.write_string(row, 12, opt(&h.contact_number))?;
            sheet.write_string(row, 13, opt(&h.email_address))?;
            sheet.write_number(row, 14, h.family_count as f64)?;
            sheet.write_string(row, 15, &h.created_at)?;
            sheet.write_string(row, 16, &h.updated_at)?;
        }
        sheet.autofit();
    }

    {
        let sheet = workbook.add_worksheet();
        sheet.set_name("Family Members")?;
        write_headers(sheet, &MEMBER_HEADERS)?;

        for (index, m) in members.iter().enumerate() {
            let row = index as u32 + 1;
            sheet.write_number(row, 0, m.id as f64)?;
            sheet.write_number(row, 1, m.household_id as f64)?;
            sheet.write_string(row, 2, &m.first_name)?;
            sheet.write_string(row, 3, &m.last_name)?;
            sheet.write_string(row, 4, &m.relationship)?;
            match m.age {
                Some(age) => sheet.write_number(row, 5, age as f64)?,
                None => sheet.write_blank(row, 5, &Format::new())?,
            };
            sheet.write_string(row, 6, &m.created_at)?;
        }
        sheet.autofit();
    }

    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        std::fs::create_dir_all(parent)?;
    }
    workbook.save(path)?;
    Ok(())
}
