USE recondb;

-- All open services
SELECT 
    t.target_name,
    a.hostname,
    a.ip_address,
    p.port_number,
    p.service_name,
    p.service_version
FROM target t
JOIN network_asset a ON t.target_id = a.target_id
JOIN port_service p ON a.asset_id = p.asset_id
WHERE p.state = 'open';

-- High risk findings
SELECT
    t.target_name,
    a.hostname,
    v.title,
    v.severity,
    v.cvss_score,
    v.status
FROM target t
JOIN network_asset a ON t.target_id = a.target_id
JOIN vulnerability v ON a.asset_id = v.asset_id
WHERE v.severity IN ('High', 'Critical');

-- Risk score by target
SELECT 
    t.target_name,
    COUNT(v.vuln_id) AS total_findings,
    SUM(
        CASE 
            WHEN v.severity = 'Critical' THEN 10
            WHEN v.severity = 'High' THEN 7
            WHEN v.severity = 'Medium' THEN 4
            WHEN v.severity = 'Low' THEN 1
            ELSE 0
        END
    ) AS risk_score
FROM target t
JOIN network_asset a ON t.target_id = a.target_id
LEFT JOIN vulnerability v ON a.asset_id = v.asset_id
GROUP BY t.target_name
ORDER BY risk_score DESC;

-- DNS records by target
SELECT
    t.target_name,
    d.hostname,
    d.record_type,
    d.record_value,
    d.ttl
FROM target t
JOIN dns_record d ON t.target_id = d.target_id;

-- Web technology inventory
SELECT
    a.hostname,
    a.ip_address,
    w.url,
    w.server_header,
    w.framework,
    w.language,
    w.tls_version
FROM network_asset a
JOIN web_technology w ON a.asset_id = w.asset_id;

-- Asset tags
SELECT
    a.hostname,
    a.ip_address,
    tg.tag_name
FROM network_asset a
JOIN asset_tag atg ON a.asset_id = atg.asset_id
JOIN tag tg ON atg.tag_id = tg.tag_id
ORDER BY a.hostname;

-- OSINT domain inventory
SELECT
    d.domain_name,
    s.subdomain_name,
    s.ip_address,
    d.created_at
FROM domain d
JOIN subdomain s ON d.domain_id = s.domain_id;

-- WHOIS inventory
SELECT
    d.domain_name,
    w.collected_at,
    LEFT(w.raw_output, 120) AS whois_preview
FROM domain d
JOIN whois_record w ON d.domain_id = w.domain_id;
