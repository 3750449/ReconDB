import socket
import subprocess
import sys

if len(sys.argv) < 2:
    print("Usage: python3 dns_lookup.py <domain>")
    sys.exit(1)

domain = sys.argv[1]

try:
    ip = socket.gethostbyname(domain)
except Exception as e:
    print(f"[-] Failed: {e}")
    sys.exit(1)

sql = f"""
USE recondb;

INSERT INTO domain (domain_name)
VALUES ('{domain}')
ON DUPLICATE KEY UPDATE domain_name = domain_name;

SELECT domain_id INTO @domain_id
FROM domain
WHERE domain_name = '{domain}'
LIMIT 1;

INSERT IGNORE INTO subdomain
(domain_id, subdomain_name, ip_address)
VALUES
(@domain_id, '{domain}', '{ip}');
"""

subprocess.run(
    ["mysql", "-u", "desmond"],
    input=sql,
    text=True,
    check=True,
)

print(f"[+] Stored {domain} -> {ip} in ReconDB")

