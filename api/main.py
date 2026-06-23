from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pymysql
import os

app = FastAPI(title="ReconDB API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "localhost"),
    "user": os.environ.get("MYSQL_USER", "desmond"),
    "password": os.environ.get("MYSQL_PASSWORD") or os.environ.get("MYSQL_PWD"),
    "database": os.environ.get("MYSQL_DATABASE", "recondb"),
    "charset": "utf8mb4",
}

@app.get("/")
def root():
    return {"message": "ReconDB API Online"}


@app.get("/targets")
def get_targets():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT target_id, target_name, target_type
        FROM target
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows


@app.get("/ports")
def get_ports():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            t.target_name,
            n.hostname,
            n.ip_address,
            p.port_number,
            p.protocol,
            p.service_name,
            p.state
        FROM port_service p
        JOIN network_asset n ON p.asset_id = n.asset_id
        JOIN target t ON n.target_id = t.target_id
        ORDER BY t.target_name, p.port_number
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows


@app.get("/domains")
def get_domains():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            d.domain_name,
            s.subdomain_name,
            s.ip_address,
            d.created_at
        FROM domain d
        JOIN subdomain s ON d.domain_id = s.domain_id
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows


@app.get("/whois")
def get_whois():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            d.domain_name,
            w.collected_at,
            LEFT(w.raw_output, 250) AS whois_preview
        FROM whois_record w
        JOIN domain d ON w.domain_id = d.domain_id
        ORDER BY w.collected_at DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows


@app.get("/summary")
def get_summary():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            (SELECT COUNT(*) FROM target) AS targets,
            (SELECT COUNT(*) FROM network_asset) AS assets,
            (SELECT COUNT(*) FROM port_service WHERE state='open') AS open_ports,
            (SELECT COUNT(*) FROM vulnerability) AS vulnerabilities,
            (SELECT COUNT(*) FROM dns_record) AS dns_records,
            (SELECT COUNT(*) FROM web_technology) AS web_technologies,
            (SELECT COUNT(*) FROM domain) AS domains,
            (SELECT COUNT(*) FROM subdomain) AS subdomains,
            (SELECT COUNT(*) FROM whois_record) AS whois_records
    """)

    row = cur.fetchone()

    cur.close()
    conn.close()

    return row

@app.get("/scans")
def get_scans():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            s.scan_id,
            t.target_name,
            s.scan_type,
            s.tool_used,
            s.scan_scope,
            s.scan_status,
            s.completed_at
        FROM scan_job s
        JOIN target t ON s.target_id = t.target_id
        ORDER BY s.completed_at DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows

@app.get("/scans")
def get_scans():
    conn = pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT
            s.scan_id,
            t.target_name,
            s.scan_type,
            s.tool_used,
            s.scan_scope,
            s.scan_status,
            s.completed_at
        FROM scan_job s
        JOIN target t ON s.target_id = t.target_id
        ORDER BY s.completed_at DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows
