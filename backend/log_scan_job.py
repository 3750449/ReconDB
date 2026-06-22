import os
import sys
import pymysql

if len(sys.argv) < 5:
    print("Usage: python3 log_scan_job.py <scan_target> <osint_domain> <ports> <reset_mode>")
    sys.exit(1)

scan_target = sys.argv[1]
osint_domain = sys.argv[2]
ports = sys.argv[3]
reset_mode = sys.argv[4]

db_password = os.environ.get("MYSQL_PWD")

conn = pymysql.connect(
    host="localhost",
    user="desmond",
    password=db_password,
    database="recondb",
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
)

try:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT target_id
            FROM target
            WHERE target_name = %s
            LIMIT 1
            """,
            (scan_target,),
        )

        target = cur.fetchone()

        if not target:
            print(f"[-] Could not find target: {scan_target}")
            sys.exit(1)

        scan_scope = (
            f"scan_target={scan_target}; "
            f"osint_domain={osint_domain}; "
            f"ports={ports}; "
            f"reset_mode={reset_mode}"
        )

        cur.execute(
            """
            INSERT INTO scan_job
            (target_id, scan_type, tool_used, scan_scope, started_at, completed_at, scan_status)
            VALUES
            (%s, %s, %s, %s, NOW(), NOW(), %s)
            """,
            (
                target["target_id"],
                "network_scan",
                "nmap",
                scan_scope,
                "completed",
            ),
        )

    conn.commit()
    print(f"[+] Logged scan job for {scan_target}")

finally:
    conn.close()
