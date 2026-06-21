USE recondb;

INSERT INTO target 
(target_name, target_type, owner_department, environment, risk_level, notes)
VALUES
('Home Lab Web Server', 'server', 'Personal Lab', 'lab', 'Medium', 'Authorized local test machine'),
('OWASP Juice Shop', 'web_app', 'Personal Lab', 'lab', 'High', 'Intentionally vulnerable training app');

INSERT INTO network_asset
(target_id, hostname, ip_address, os_name, is_internet_facing, last_seen)
VALUES
(1, 'lab-web-01', '192.168.1.50', 'Ubuntu Server', FALSE, NOW()),
(2, 'juice-shop', '127.0.0.1', 'Docker Container', FALSE, NOW());

INSERT INTO port_service
(asset_id, port_number, protocol, service_name, service_version, state)
VALUES
(1, 22, 'tcp', 'ssh', 'OpenSSH', 'open'),
(1, 80, 'tcp', 'http', 'nginx', 'open'),
(2, 3000, 'tcp', 'http', 'Node.js Express', 'open');

INSERT INTO vulnerability
(asset_id, cve_id, title, severity, cvss_score, description)
VALUES
(2, NULL, 'Intentionally vulnerable web application', 'High', 8.0, 'Training target for authorized testing');

INSERT INTO dns_record
(target_id, hostname, record_type, record_value, ttl)
VALUES
(1, 'lab-web-01.local', 'A', '192.168.1.50', 3600),
(2, 'juice-shop.local', 'A', '127.0.0.1', 3600);

INSERT INTO web_technology
(asset_id, url, server_header, framework, cms, language, tls_version)
VALUES
(1, 'http://192.168.1.50', 'nginx', NULL, NULL, NULL, NULL),
(2, 'http://127.0.0.1:3000', 'Node.js Express', 'Express', NULL, 'JavaScript', NULL);

INSERT INTO tag
(tag_name)
VALUES
('lab'),
('training'),
('web'),
('linux'),
('high-risk');

INSERT INTO asset_tag
(asset_id, tag_id)
VALUES
(1, 1),
(1, 4),
(2, 2),
(2, 3),
(2, 5);

