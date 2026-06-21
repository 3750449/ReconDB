# ReconDB

Security Asset Intelligence Platform

ReconDB is a database-backed security asset intelligence platform designed to store, organize, and analyze information gathered from authorized lab environments and managed systems.

---

## Features

* Asset Inventory Management
* DNS Record Tracking
* Port and Service Enumeration
* Vulnerability Tracking
* Web Technology Fingerprinting
* Risk Reporting
* Terminal Dashboard Integration
* Fastfetch Branding
* Automated Nmap XML Import
* DNS OSINT Collection
* WHOIS Collection
* Automated Pipeline Execution

---

## Current Schema

### Core Tables

* Target
* Network_Asset
* Port_Service
* Vulnerability
* Scan_Job

### Intelligence Tables

* DNS_Record
* Web_Technology
* Tag
* Asset_Tag

### OSINT Tables

* Domain
* Subdomain
* Whois_Record

---

## Example Reports

* Open Services Report
* High Risk Findings Report
* Risk Score Report
* DNS Inventory Report
* Technology Inventory Report
* Asset Tag Report
* Domain Inventory Report
* WHOIS Inventory Report

---

## Project Structure

```text
ReconDB/
├── backend/
│   ├── ingest_nmap.py
│   ├── dns_lookup.py
│   └── whois_lookup.py
├── data/
├── docs/
│   ├── branding/
│   ├── diagrams/
│   └── screenshots/
├── frontend/
├── scripts/
│   ├── recon_banner.sh
│   └── run_pipeline.sh
├── sql/
│   ├── 01_schema.sql
│   ├── 02_seed_data.sql
│   └── 03_reports.sql
├── README.md
└── .gitignore
```

---

## Current Development Status

### Phase 1 — Database Foundation

Complete

Implemented:

* Relational schema
* Seed data
* Reporting queries
* Risk scoring

### Phase 2 — Intelligence Model

Complete

Implemented:

* DNS records
* Web technologies
* Asset tagging
* Fastfetch branding
* Terminal dashboard

### Phase 3 — Automated Scan Ingestion

Complete

Implemented:

* Nmap XML export
* Python XML parsing
* Automated database import
* Duplicate protection
* Parameterized scan input
* ReconDB CLI pipeline

### Phase 4 — OSINT Collection

Complete

Implemented:

* Domain storage
* Subdomain storage
* DNS resolution
* WHOIS collection
* WHOIS storage
* OSINT reporting
* Integrated pipeline execution

---

## Usage

Run the full pipeline using defaults:

```bash
piperecon
```

Run the pipeline against a custom scan target and domain:

```bash
piperecon 127.0.0.1 example.com
```

Pipeline workflow:

```text
Nmap Scan
↓
XML Export
↓
ReconDB Import
↓
DNS Lookup
↓
WHOIS Lookup
↓
MySQL Storage
↓
Report Generation
```

---

## Example Output

ReconDB currently collects:

### Asset Intelligence

* Hosts
* Services
* Ports
* Vulnerabilities
* Technologies
* DNS Records

### OSINT Intelligence

* Domains
* Subdomains
* DNS Resolution Results
* WHOIS Data

---

## Technologies

* MySQL
* Python
* Bash
* Linux / WSL
* Fastfetch
* Nmap
* WHOIS

---

## Future Development

### Phase 5 — Backend API

* FastAPI
* REST endpoints
* JSON export
* Authentication

### Phase 6 — Web Dashboard

* React frontend
* Asset search
* Vulnerability views
* Risk visualization
* OSINT views

### Phase 7 — Advanced Intelligence

* Historical scan comparison
* Asset relationship mapping
* Technology trend tracking
* Dashboard analytics
* Vulnerability enrichment

---

## Author

Desmond Farley-Williams

ReconDB is a personal cybersecurity and database engineering project focused on security asset intelligence, automation, infrastructure visibility, and OSINT collection within authorized environments.
