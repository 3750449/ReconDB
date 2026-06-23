# Changelog

All notable changes to ReconDB will be documented in this file.

---

## v0.6.6 - Environment Config and CORS Support

### Added

- `.env.example` file for documenting required environment variables
- CORS middleware support for the React dashboard
- Frontend API base URL environment variable support
- API database configuration environment variable support
- Python `requirements.txt` for backend/API dependencies

### Changed

- FastAPI can now read database settings from environment variables
- React can now read the API base URL from `VITE_API_BASE_URL`
- Dashboard frontend can connect cleanly to the FastAPI backend from Vite development ports
- Setup guide now uses `pip install -r requirements.txt`

---

## v0.6.4 - Dashboard Search and Scan History

### Added

- React dashboard global search
- Clear search button
- No-results messages for filtered tables
- Scan history API endpoint
- Scan history dashboard table
- Reset / no-reset badges
- Status badges
- Improved scan history layout
- README architecture documentation
- Setup guide

### Changed

- Improved dashboard table readability
- Improved scan history formatting
- Improved README structure for GitHub presentation

---

## v0.6.3 - Scan Job History

### Added

- Scan job history logging
- `scan_job` table usage
- Pipeline scan scope tracking
- Target, OSINT domain, ports, and reset mode tracking

---

## v0.6.2 - No-Reset Pipeline Mode

### Added

- `--no-reset` pipeline option
- `--reset` pipeline option
- Multi-target dashboard support

### Changed

- Improved pipeline argument handling
- Improved scan target parsing

---

## v0.6.1 - Arbitrary Target and Port Scanning

### Added

- Custom scan target support
- Custom OSINT domain support
- Optional custom port list support
- URL-style input normalization

---

## v0.6.0 - React Dashboard

### Added

- Vite React frontend
- Axios API integration
- Dashboard summary cards
- Targets table
- Open ports table
- Domains table
- WHOIS table

---

## v0.4.0 - OSINT Collection Complete

### Added

- DNS lookup script
- WHOIS lookup script
- Domain table
- Subdomain table
- WHOIS record table
- SQL reports for OSINT data

---

## Earlier Development

### Added

- MySQL schema
- Seed data
- Nmap XML ingestion
- Asset inventory tables
- Port and service tracking
- Vulnerability table
- Tagging tables
- Bash pipeline automation
