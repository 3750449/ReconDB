#!/bin/bash
clear

echo "======================================"
echo "        ReconDB Security Reports       "
echo "======================================"
echo

mysql -u desmond -p --table < sql/03_reports.sql
