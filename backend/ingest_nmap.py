import xml.etree.ElementTree as ET
import subprocess
import sys

XML_FILE = sys.argv[1] if len(sys.argv) > 1 else "data/local_scan.xml"

def run_sql(sql: str) -> None:
    subprocess.run(
        ["mysql", "-u", "desmond"],
        input=sql,
        text=True,
        check=True,
    )

tree = ET.parse(XML_FILE)
root = tree.getroot()

sql = """
USE recondb;

INSERT INTO target
(target_name, target_type, owner_department, environment, risk_level, notes)
SELECT
    'Localhost Scan',
    'host',
    'Personal Lab',
    'lab',
    'Medium',
    'Imported from nmap XML'
WHERE NOT EXISTS (
    SELECT 1
    FROM target
    WHERE target_name = 'Localhost Scan'
);

SELECT target_id
INTO @target_id
FROM target
WHERE target_name = 'Localhost Scan'
LIMIT 1;

INSERT INTO network_asset
(target_id, hostname, ip_address, os_name, is_internet_facing, last_seen)
SELECT
    @target_id,
    'localhost',
    '127.0.0.1',
    'WSL/Localhost',
    FALSE,
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM network_asset
    WHERE hostname = 'localhost'
      AND ip_address = '127.0.0.1'
);

SELECT asset_id
INTO @asset_id
FROM network_asset
WHERE hostname = 'localhost'
  AND ip_address = '127.0.0.1'
LIMIT 1;
"""

for host in root.findall("host"):
    ports = host.find("ports")
    if ports is None:
        continue

    for port in ports.findall("port"):
        port_id = port.get("portid")
        protocol = port.get("protocol")

        state = port.find("state")
        service = port.find("service")

        if state is None or state.get("state") != "open":
            continue

        service_name = service.get("name") if service is not None else "unknown"

        sql += f"""
INSERT IGNORE INTO port_service
(asset_id, port_number, protocol, service_name, service_version, state, discovered_at)
VALUES
(@asset_id, {port_id}, '{protocol}', '{service_name}', NULL, 'open', NOW());
"""

run_sql(sql)

print("[+] Imported nmap scan into ReconDB")
