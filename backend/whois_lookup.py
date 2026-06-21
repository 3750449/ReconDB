import subprocess
import sys

if len(sys.argv) < 2:
    print("Usage: python3 whois_lookup.py <domain>")
    sys.exit(1)

domain = sys.argv[1]

result = subprocess.run(
    ["whois", domain],
    capture_output=True,
    text=True,
)

raw = result.stdout.replace("'", "''")[:5000]

sql = f"""
USE recondb;

INSERT INTO domain (domain_name)
VALUES ('{domain}')
ON DUPLICATE KEY UPDATE domain_name = domain_name;

SELECT domain_id INTO @domain_id
FROM domain
WHERE domain_name = '{domain}'
LIMIT 1;

INSERT INTO whois_record
(domain_id, raw_output)
VALUES
(@domain_id, '{raw}');
"""

subprocess.run(
    ["mysql", "-u", "desmond"],
    input=sql,
    text=True,
    check=True,
)

print(f"[+] Stored WHOIS data for {domain}")
