# ReconDB Setup Guide

This guide explains how to install, configure, and run ReconDB locally.

ReconDB is a security asset intelligence platform that uses MySQL, Python, Nmap, FastAPI, and React to collect, store, and display asset intelligence from authorized systems and lab environments.

---

## Requirements

ReconDB was developed and tested in a Linux / WSL environment.

Required tools:

* Python 3
* MySQL Server
* Nmap
* Node.js
* npm
* Git
* whois

Optional:

* Fastfetch
* Docker Desktop for WSL if running local vulnerable containers

---

## Clone the Repository

```bash
git clone https://github.com/3750449/ReconDB.git
cd ReconDB
```

---

## Install System Dependencies

```bash
sudo apt update
sudo apt install mysql-server nmap whois python3 python3-venv python3-pymysql nodejs npm -y
```

---

## Configure MySQL

Start MySQL:

```bash
sudo service mysql start
```

Create or verify the MySQL user used by ReconDB.

Example:

```sql
CREATE USER 'desmond'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'desmond'@'localhost';
FLUSH PRIVILEGES;
```

ReconDB expects the MySQL user:

```text
desmond
```

The password is passed using the `MYSQL_PWD` environment variable when running the API or pipeline.

---

## Initialize the Database

From the project root:

```bash
read -s -p "MySQL password: " MYSQL_PWD
echo
export MYSQL_PWD

mysql -u desmond < sql/01_schema.sql
mysql -u desmond < sql/02_seed_data.sql

unset MYSQL_PWD
```

---

## Python Virtual Environment

Create and activate the virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install API dependencies:

```bash
pip install -r requirements.txt
```

---

## Run the FastAPI Backend

From the project root:

```bash
source .venv/bin/activate

read -s -p "MySQL password: " MYSQL_PWD
echo
export MYSQL_PWD

python -m uvicorn api.main:app --reload
```

API documentation:

```text
http://localhost:8000/docs
```

Useful API routes:

```text
GET /
GET /summary
GET /targets
GET /ports
GET /domains
GET /whois
GET /scans
```

---

## Run the React Frontend

Open a second terminal.

From the project root:

```bash
cd frontend
npm install
npm run dev
```

Dashboard:

```text
http://localhost:5173
```

If port `5173` is already in use, Vite may start on another port such as:

```text
http://localhost:5174
```

---

## Run the ReconDB Pipeline

ReconDB includes a Bash automation script called `piperecon`.

Default scan:

```bash
piperecon
```

Scan a target and enrich with a domain:

```bash
piperecon pentest-ground.com pentest-ground.com "81,4280,5013,6379,7001,9000"
```

Run without resetting the database:

```bash
piperecon --no-reset juice-shop.lab.pentest-forge.com pentest-forge.com
```

Scan URL-style input:

```bash
piperecon http://localhost:8000/docs example.com
```

Show help:

```bash
piperecon --help
```

---

## Pipeline Behavior

The pipeline performs these steps:

```text
1. Optionally resets the database
2. Runs Nmap against the selected target
3. Exports Nmap results as XML
4. Imports open ports into MySQL
5. Logs the scan job
6. Runs DNS lookup
7. Runs WHOIS lookup
8. Runs SQL reports
9. Updates the API/dashboard data
```

---

## Reset vs No-Reset Mode

Reset mode wipes and rebuilds the ReconDB dataset before scanning:

```bash
piperecon pentest-ground.com pentest-ground.com "81,4280,5013,6379,7001,9000"
```

No-reset mode keeps existing targets and adds new scan data:

```bash
piperecon --no-reset juice-shop.lab.pentest-forge.com pentest-forge.com
```

Use no-reset mode when building a multi-target dashboard.

---

## Generated Files

Nmap XML output is generated under:

```text
data/scan.xml
```

Generated XML files are ignored by Git and should not be committed.

---

## Safe Use Notice

Only scan systems you own, manage, or have explicit permission to test.

Recommended targets:

* Localhost
* Personal lab machines
* Local virtual machines
* Intentionally vulnerable training apps
* Public labs that explicitly allow scanning

Do not scan random public websites, schools, companies, government systems, or third-party infrastructure without authorization.

---

## Troubleshooting

### MySQL Access Denied

Error:

```text
ERROR 1045 (28000): Access denied for user 'desmond'@'localhost'
```

Fix:

* Re-enter the correct MySQL password.
* Confirm the `desmond` MySQL user exists.
* Confirm the user has privileges.
* Export `MYSQL_PWD` before running FastAPI.

---

### FastAPI Cannot Connect to MySQL

Restart FastAPI with:

```bash
read -s -p "MySQL password: " MYSQL_PWD
echo
export MYSQL_PWD

python -m uvicorn api.main:app --reload
```

---

### React Says Failed to Connect

Check that FastAPI is running:

```text
http://localhost:8000/summary
```

Then refresh:

```text
http://localhost:5173
```

---

### Vite Uses Port 5174 Instead of 5173

This means port `5173` is already in use.

Use the URL Vite prints in the terminal:

```text
http://localhost:5174
```

---

## Development Workflow

After changes:

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

Check current version:

```bash
cat VERSION
```

Check release tags:

```bash
git tag
```

---

## Current Version

```text
v0.6.4
```

---

## Author

Desmond Farley-Williams
