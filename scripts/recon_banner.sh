#!/bin/bash

clear

echo "╔════════════════════════════════════════════╗"
echo "║                  ReconDB                  ║"
echo "║        Security Asset Intelligence        ║"
echo "╚════════════════════════════════════════════╝"
echo

echo "Environment"
echo "-----------"
date
echo

echo "Database Summary"
echo "----------------"

mysql -u desmond -p --table -e "
USE recondb;

SELECT 
    (SELECT COUNT(*) FROM target) AS Targets,
    (SELECT COUNT(*) FROM network_asset) AS Assets,
    (SELECT COUNT(*) FROM port_service WHERE state = 'open') AS Ports,
    (SELECT COUNT(*) FROM vulnerability) AS Vulns,
    (SELECT COUNT(*) FROM dns_record) AS DNS,
    (SELECT COUNT(*) FROM web_technology) AS Tech,
    (SELECT COUNT(*) FROM domain) AS Domains,
    (SELECT COUNT(*) FROM subdomain) AS Subs,
    (SELECT COUNT(*) FROM whois_record) AS WhoisRecords;
"
