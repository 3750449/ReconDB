#!/bin/bash

SCAN_TARGET=${1:-127.0.0.1}
OSINT_DOMAIN=${2:-google.com}

read -s -p "MySQL password: " MYSQL_PWD
echo
export MYSQL_PWD

echo "[+] Resetting database..."
mysql -u desmond < sql/01_schema.sql
mysql -u desmond < sql/02_seed_data.sql

echo "[+] Running nmap scan against $SCAN_TARGET..."
nmap -oX data/scan.xml "$SCAN_TARGET"

echo "[+] Importing scan..."
python3 backend/ingest_nmap.py data/scan.xml

echo "[+] Running OSINT DNS lookup for $OSINT_DOMAIN..."
python3 backend/dns_lookup.py "$OSINT_DOMAIN"

echo "[+] Running WHOIS lookup for $OSINT_DOMAIN..."
python3 backend/whois_lookup.py "$OSINT_DOMAIN"

echo "[+] Running reports..."
mysql -u desmond < sql/03_reports.sql

unset MYSQL_PWD

echo
echo "[+] Pipeline complete."
echo "[+] ReconDB updated successfully."
