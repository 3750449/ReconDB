import sys
import subprocess
import xml.etree.ElementTree as ET

if len(sys.argv) < 2:
    print("Usage: python3 ingest_nmap.py <nmap_xml_file> [scan_label]")
    sys.exit(1)

XML_FILE = sys.argv[1]
SCAN_LABEL = sys.argv[2] if len(sys.argv) > 2 else "Nmap Scan"


def esc(value):
    if value is None:
        return ""
    return str(value).replace("\\", "\\\\").replace("'", "''")


def sql_value(value):
    if value is None or value == "":
        return "NULL"
    return f"'{esc(value)}'"


def run_sql(sql: str) -> None:
    subprocess.run(
        ["mysql", "-u", "desmond"],
        input=sql,
        text=True,
        check=True,
    )


tree = ET.parse(XML_FILE)
root = tree.getroot()

sql = "USE recondb;\n"
total_ports = 0

for host in root.findall("host"):
    status = host.find("status")
    if status is not None and status.get("state") != "up":
        continue

    address = host.find("address")
    ip_address = address.get("addr") if address is not None else "unknown"

    hostname = None
    hostnames = host.find("hostnames")
    if hostnames is not None:
        hostname_node = hostnames.find("hostname")
        if hostname_node is not None:
            hostname = hostname_node.get("name")

    if not hostname:
        hostname = SCAN_LABEL if SCAN_LABEL != ip_address else ip_address

    target_name = SCAN_LABEL

    sql += f"""
INSERT INTO target
(target_name, target_type, owner_department, environment, risk_level, notes)
SELECT
    '{esc(target_name)}',
    'host',
    'Personal Lab',
    'lab',
    'Medium',
    'Imported from nmap XML'
WHERE NOT EXISTS (
    SELECT 1
    FROM target
    WHERE target_name = '{esc(target_name)}'
);

SELECT target_id
INTO @target_id
FROM target
WHERE target_name = '{esc(target_name)}'
LIMIT 1;

INSERT INTO network_asset
(target_id, hostname, ip_address, os_name, is_internet_facing, last_seen)
SELECT
    @target_id,
    '{esc(hostname)}',
    '{esc(ip_address)}',
    'Unknown',
    FALSE,
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM network_asset
    WHERE target_id = @target_id
      AND ip_address = '{esc(ip_address)}'
);

SELECT asset_id
INTO @asset_id
FROM network_asset
WHERE target_id = @target_id
  AND ip_address = '{esc(ip_address)}'
LIMIT 1;

UPDATE network_asset
SET hostname = '{esc(hostname)}',
    last_seen = NOW()
WHERE asset_id = @asset_id;
"""

    ports = host.find("ports")
    if ports is None:
        continue

    for port in ports.findall("port"):
        state = port.find("state")
        if state is None or state.get("state") != "open":
            continue

        try:
            port_number = int(port.get("portid"))
        except (TypeError, ValueError):
            continue

        protocol = port.get("protocol") or "tcp"
        service = port.find("service")

        service_name = "unknown"
        service_version = None

        if service is not None:
            service_name = service.get("name") or "unknown"

            product = service.get("product")
            version = service.get("version")

            if product and version:
                service_version = f"{product} {version}"
            elif product:
                service_version = product
            elif version:
                service_version = version

        sql += f"""
INSERT IGNORE INTO port_service
(asset_id, port_number, protocol, service_name, service_version, state, discovered_at)
VALUES
(@asset_id,
 {port_number},
 '{esc(protocol)}',
 '{esc(service_name)}',
 {sql_value(service_version)},
 'open',
 NOW());
"""

        total_ports += 1

run_sql(sql)

print(f"[+] Imported {total_ports} open ports from {XML_FILE} as '{SCAN_LABEL}'")
