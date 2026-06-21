DROP DATABASE IF EXISTS recondb;
CREATE DATABASE recondb;
USE recondb;

CREATE TABLE target (
    target_id INT AUTO_INCREMENT PRIMARY KEY,
    target_name VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    owner_department VARCHAR(100),
    environment VARCHAR(50),
    risk_level VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE network_asset (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    target_id INT NOT NULL,
    hostname VARCHAR(255),
    ip_address VARCHAR(45),
    mac_address VARCHAR(50),
    os_name VARCHAR(100),
    is_internet_facing BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP NULL,
    FOREIGN KEY (target_id) REFERENCES target(target_id)
);

CREATE TABLE port_service (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    port_number INT NOT NULL,
    protocol VARCHAR(10) DEFAULT 'tcp',
    service_name VARCHAR(100),
    service_version VARCHAR(255),
    state VARCHAR(20),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_asset_port_protocol (asset_id, port_number, protocol),
    FOREIGN KEY (asset_id) REFERENCES network_asset(asset_id)
);





CREATE TABLE vulnerability (
    vuln_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    cve_id VARCHAR(30),
    title VARCHAR(255),
    severity VARCHAR(20),
    cvss_score DECIMAL(3,1),
    description TEXT,
    status VARCHAR(30) DEFAULT 'open',
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES network_asset(asset_id)
);

CREATE TABLE scan_job (
    scan_id INT AUTO_INCREMENT PRIMARY KEY,
    target_id INT NOT NULL,
    scan_type VARCHAR(50),
    tool_used VARCHAR(100),
    scan_scope TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    scan_status VARCHAR(30),
    FOREIGN KEY (target_id) REFERENCES target(target_id)
);


CREATE TABLE dns_record (
    dns_id INT AUTO_INCREMENT PRIMARY KEY,
    target_id INT NOT NULL,
    hostname VARCHAR(255),
    record_type VARCHAR(20),
    record_value TEXT,
    ttl INT,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_id) REFERENCES target(target_id)
);

CREATE TABLE web_technology (
    tech_id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    url TEXT,
    server_header VARCHAR(255),
    framework VARCHAR(100),
    cms VARCHAR(100),
    language VARCHAR(100),
    tls_version VARCHAR(50),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES network_asset(asset_id)
);

CREATE TABLE tag (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE
);

CREATE TABLE asset_tag (
    asset_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY(asset_id, tag_id),
    FOREIGN KEY (asset_id) REFERENCES network_asset(asset_id),
    FOREIGN KEY (tag_id) REFERENCES tag(tag_id)
);


CREATE TABLE domain (
    domain_id INT AUTO_INCREMENT PRIMARY KEY,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    registrar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subdomain (
    subdomain_id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT NOT NULL,
    subdomain_name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),

    UNIQUE KEY unique_subdomain_ip
    (domain_id, subdomain_name, ip_address),

    FOREIGN KEY (domain_id) REFERENCES domain(domain_id)
);

CREATE TABLE whois_record (
    whois_id INT AUTO_INCREMENT PRIMARY KEY,
    domain_id INT NOT NULL,
    registrar VARCHAR(255),
    whois_server VARCHAR(255),
    raw_output TEXT,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domain(domain_id)
);
