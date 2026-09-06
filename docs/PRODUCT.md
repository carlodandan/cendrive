# CenDrive Product Documentation

## Product Vision
CenDrive is a comprehensive, offline-first database management system explicitly designed for census-type data collection and household record management. It aims to provide local government units (LGUs), community organizations, and researchers with a reliable, private, and high-performance tool for managing demographic information.

## Target Audience
- Local Government Units (LGUs) in the Philippines (Barangays, Municipalities, Cities).
- Community organizers and non-governmental organizations (NGOs).
- Researchers requiring localized, offline demographic data collection.

## Core Features

### 1. Household and Family Management
- **Hierarchical Records:** Data is structured around a "Household Head" with the ability to add up to 30 family members per household.
- **Detailed Information:** Captures comprehensive details including full names, physical addresses, contact information, ages, and relationships to the household head.

### 2. Philippine Geographic Context
- **Localized Data Entry:** The application comes pre-configured with Philippine geographic hierarchies.
- **Regions to Barangays:** Users can select Region, Province, City/Municipality, and Barangay, streamlining the data entry process and standardizing location data for accurate reporting. (Data sourced from `src/data` and maintained via utility scripts).

### 3. Privacy and Data Sovereignty (Offline-First)
- **Zero Cloud Dependency:** Unlike web-based solutions, CenDrive is a purely local desktop application. All data resides in a local SQLite file on the user's machine.
- **Data Privacy:** Sensitive census data never leaves the device, eliminating cloud security risks and ensuring compliance with data privacy regulations.

### 4. Advanced Reporting and Export
- **Built-in Analytics:** The Dashboard provides high-level statistics (total households, total members, average family size).
- **Data Export:** Seamless export functionality allows users to generate comprehensive reports in standard formats (`.csv`, `.xlsx`), making it easy to share data with other systems or stakeholders.

### 5. Seamless Maintenance & Updates
- **Auto-Updater:** CenDrive features a built-in, secure auto-updater. It checks GitHub releases for signed updates and installs them seamlessly in the background.
- **Backup & Compaction:** Built-in tools allow users to easily back up their database and compact it to save disk space without requiring technical database knowledge.

## Design Philosophy
- **Performance:** Leveraging Rust for the backend ensures that the application remains snappy even with thousands of records.
- **User Experience:** The React/Tailwind frontend provides a modern, responsive, and intuitive interface, supporting both light and dark modes to respect system preferences.
