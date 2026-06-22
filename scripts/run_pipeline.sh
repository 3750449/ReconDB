#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT" || exit 1

RESET_DB=true

usage() {
    echo "Usage:"
    echo "  piperecon [options] [scan_target] [osint_domain] [ports]"
    echo
    echo "Options:"
    echo "  --no-reset     Keep existing database data"
    echo "  --reset        Reset database before scan"
    echo "  -h, --help     Show help"
    echo
    echo "Examples:"
    echo "  piperecon"
    echo "  piperecon 127.0.0.1 example.com"
    echo "  piperecon juice-shop.lab.pentest-forge.com pentest-forge.com"
    echo "  piperecon https://juice-shop.lab.pentest-forge.com pentest-forge.com"
    echo "  piperecon pentest-ground.com pentest-ground.com \"81,4280,5013,6379,7001,9000\""
    echo "  piperecon --no-reset pentest-ground.com pentest-ground.com \"81,4280,5013,6379,7001,9000\""
}

normalize_input() {
    local value="$1"

    value="${value#http://}"
    value="${value#https://}"
    value="${value%%/*}"

    echo "$value"
}

while [[ "$1" == --* || "$1" == "-h" ]]; do
    case "$1" in
        --no-reset)
            RESET_DB=false
            shift
            ;;
        --reset)
            RESET_DB=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [ "$#" -eq 0 ]; then
    RAW_SCAN_TARGET="127.0.0.1"
    RAW_OSINT_DOMAIN="example.com"
else
    RAW_SCAN_TARGET="$1"
    RAW_OSINT_DOMAIN="${2:-$1}"
fi

PORTS="${3:-}"

SCAN_INPUT="$(normalize_input "$RAW_SCAN_TARGET")"
OSINT_INPUT="$(normalize_input "$RAW_OSINT_DOMAIN")"

if [[ "$SCAN_INPUT" == *:* && -z "$PORTS" ]]; then
    SCAN_TARGET="${SCAN_INPUT%%:*}"
    PORTS="${SCAN_INPUT##*:}"
else
    SCAN_TARGET="$SCAN_INPUT"
fi

OSINT_DOMAIN="${OSINT_INPUT%%:*}"

mkdir -p data

read -s -p "MySQL password: " MYSQL_PWD
echo
export MYSQL_PWD

if [ "$RESET_DB" = true ]; then
    echo "[+] Resetting database..."
    mysql -u desmond < sql/01_schema.sql
    mysql -u desmond < sql/02_seed_data.sql
else
    echo "[+] Skipping database reset..."
fi

if [ -n "$PORTS" ]; then
    echo "[+] Running nmap scan against $SCAN_TARGET on ports $PORTS..."
    nmap -Pn -p "$PORTS" -oX data/scan.xml "$SCAN_TARGET"
else
    echo "[+] Running nmap scan against $SCAN_TARGET..."
    nmap -Pn -oX data/scan.xml "$SCAN_TARGET"
fi

echo "[+] Importing scan..."
python3 backend/ingest_nmap.py data/scan.xml "$SCAN_TARGET"

echo "[+] Logging scan job..."
python3 backend/log_scan_job.py "$SCAN_TARGET" "$OSINT_DOMAIN" "${PORTS:-default}" "$RESET_DB"

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
