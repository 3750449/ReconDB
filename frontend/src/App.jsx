import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function formatDate(value) {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function parseScanScope(scope) {
  const result = {
    scanTarget: 'N/A',
    osintDomain: 'N/A',
    ports: 'default',
    resetMode: 'N/A',
  }

  if (!scope) {
    return result
  }

  scope.split(';').forEach((part) => {
    const [rawKey, ...rawValue] = part.trim().split('=')
    const key = rawKey?.trim()
    const value = rawValue.join('=').trim()

    if (key === 'scan_target') result.scanTarget = value
    if (key === 'osint_domain') result.osintDomain = value
    if (key === 'ports') result.ports = value
    if (key === 'reset_mode') result.resetMode = value
  })

  return result
}

function matchesSearch(item, searchTerm) {
  if (!searchTerm) return true

  return JSON.stringify(item)
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
}

function normalizeSortValue(value) {
  if (value === null || value === undefined) return ''

  if (typeof value === 'number') return value

  const date = new Date(value)
  if (!Number.isNaN(date.getTime()) && String(value).includes('-')) {
    return date.getTime()
  }

  const numericValue = Number(value)
  if (!Number.isNaN(numericValue) && value !== '') {
    return numericValue
  }

  return String(value).toLowerCase()
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''

  const stringValue = String(value).replaceAll('"', '""')

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue}"`
  }

  return stringValue
}

function downloadCsv(filename, rows, columns) {
  if (!rows.length) return

  const header = columns.map((column) => escapeCsvValue(column.label)).join(',')

  const body = rows
    .map((row) =>
      columns.map((column) => escapeCsvValue(row[column.key])).join(',')
    )
    .join('\n')

  const csvContent = `${header}\n${body}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

function sortRows(rows, sortConfig, tableName) {
  if (!sortConfig || sortConfig.table !== tableName) {
    return rows
  }

  return [...rows].sort((a, b) => {
    const aValue = normalizeSortValue(a[sortConfig.key])
    const bValue = normalizeSortValue(b[sortConfig.key])

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1
    }

    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1
    }

    return 0
  })
}

function paginateRows(rows, currentPage, rowsPerPage) {
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage

  return rows.slice(startIndex, endIndex)
}

function getTotalPages(rows, rowsPerPage) {
  return Math.max(1, Math.ceil(rows.length / rowsPerPage))
}

function StatusBadge({ value }) {
  return <span className={`badge badge-${value}`}>{value}</span>
}

function ResetBadge({ value }) {
  const label = value === 'true' ? 'Reset' : 'No Reset'
  const className = value === 'true' ? 'badge-reset' : 'badge-no-reset'

  return <span className={`badge ${className}`}>{label}</span>
}

function NoResultsRow({ colSpan }) {
  return (
    <tr>
      <td className="no-results" colSpan={colSpan}>
        No results match your search.
      </td>
    </tr>
  )
}

function SortableTh({ label, tableName, columnKey, sortConfig, onSort }) {
  const isActive =
    sortConfig?.table === tableName && sortConfig?.key === columnKey

  const arrow = isActive
    ? sortConfig.direction === 'asc'
      ? '▲'
      : '▼'
    : '↕'

  return (
    <th>
      <button
        type="button"
        className={`sort-button ${isActive ? 'active-sort' : ''}`}
        onClick={() => onSort(tableName, columnKey)}
      >
        {label} <span>{arrow}</span>
      </button>
    </th>
  )
}

function PaginationControls({ currentPage, totalPages, onPrevious, onNext }) {
  return (
    <div className="pagination-controls">
      <button type="button" onClick={onPrevious} disabled={currentPage === 1}>
        Previous
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  )
}

function App() {
  const [summary, setSummary] = useState(null)
  const [targets, setTargets] = useState([])
  const [ports, setPorts] = useState([])
  const [domains, setDomains] = useState([])
  const [whois, setWhois] = useState([])
  const [scans, setScans] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState(null)
  const [targetsPage, setTargetsPage] = useState(1)
  const [portsPage, setPortsPage] = useState(1)
  const [domainsPage, setDomainsPage] = useState(1)
  const [whoisPage, setWhoisPage] = useState(1)
  const [scansPage, setScansPage] = useState(1)
  const [error, setError] = useState('')

  const rowsPerPage = 10

  useEffect(() => {
    axios
      .get(`${API_BASE}/summary`)
      .then((res) => setSummary(res.data))
      .catch((err) => {
        console.error(err)
        setError('Failed to connect to ReconDB API')
      })

    axios
      .get(`${API_BASE}/targets`)
      .then((res) => setTargets(res.data))
      .catch(console.error)

    axios
      .get(`${API_BASE}/ports`)
      .then((res) => setPorts(res.data))
      .catch(console.error)

    axios
      .get(`${API_BASE}/domains`)
      .then((res) => setDomains(res.data))
      .catch(console.error)

    axios
      .get(`${API_BASE}/whois`)
      .then((res) => setWhois(res.data))
      .catch(console.error)

    axios
      .get(`${API_BASE}/scans`)
      .then((res) => setScans(res.data))
      .catch(console.error)
  }, [])

  useEffect(() => {
    setTargetsPage(1)
    setPortsPage(1)
    setDomainsPage(1)
    setWhoisPage(1)
    setScansPage(1)
  }, [searchTerm, sortConfig])

  function handleSort(tableName, columnKey) {
    setSortConfig((currentSort) => {
      if (
        currentSort?.table === tableName &&
        currentSort?.key === columnKey
      ) {
        return {
          table: tableName,
          key: columnKey,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        table: tableName,
        key: columnKey,
        direction: 'asc',
      }
    })
  }

  const filteredTargets = useMemo(
    () => targets.filter((target) => matchesSearch(target, searchTerm)),
    [targets, searchTerm]
  )

  const filteredPorts = useMemo(
    () => ports.filter((port) => matchesSearch(port, searchTerm)),
    [ports, searchTerm]
  )

  const filteredDomains = useMemo(
    () => domains.filter((domain) => matchesSearch(domain, searchTerm)),
    [domains, searchTerm]
  )

  const filteredWhois = useMemo(
    () => whois.filter((record) => matchesSearch(record, searchTerm)),
    [whois, searchTerm]
  )

  const preparedScans = useMemo(
    () =>
      scans.map((scan) => {
        const scope = parseScanScope(scan.scan_scope)

        return {
          ...scan,
          scanTarget: scope.scanTarget || scan.target_name,
          osintDomain: scope.osintDomain,
          ports: scope.ports,
          resetMode: scope.resetMode,
        }
      }),
    [scans]
  )

  const filteredScans = useMemo(
    () => preparedScans.filter((scan) => matchesSearch(scan, searchTerm)),
    [preparedScans, searchTerm]
  )

  const sortedTargets = useMemo(
    () => sortRows(filteredTargets, sortConfig, 'targets'),
    [filteredTargets, sortConfig]
  )

  const sortedPorts = useMemo(
    () => sortRows(filteredPorts, sortConfig, 'ports'),
    [filteredPorts, sortConfig]
  )

  const sortedDomains = useMemo(
    () => sortRows(filteredDomains, sortConfig, 'domains'),
    [filteredDomains, sortConfig]
  )

  const sortedWhois = useMemo(
    () => sortRows(filteredWhois, sortConfig, 'whois'),
    [filteredWhois, sortConfig]
  )

  const sortedScans = useMemo(
    () => sortRows(filteredScans, sortConfig, 'scans'),
    [filteredScans, sortConfig]
  )

  const totalTargetsPages = getTotalPages(sortedTargets, rowsPerPage)
  const totalPortsPages = getTotalPages(sortedPorts, rowsPerPage)
  const totalDomainsPages = getTotalPages(sortedDomains, rowsPerPage)
  const totalWhoisPages = getTotalPages(sortedWhois, rowsPerPage)
  const totalScansPages = getTotalPages(sortedScans, rowsPerPage)

  const paginatedTargets = useMemo(
    () => paginateRows(sortedTargets, targetsPage, rowsPerPage),
    [sortedTargets, targetsPage]
  )

  const paginatedPorts = useMemo(
    () => paginateRows(sortedPorts, portsPage, rowsPerPage),
    [sortedPorts, portsPage]
  )

  const paginatedDomains = useMemo(
    () => paginateRows(sortedDomains, domainsPage, rowsPerPage),
    [sortedDomains, domainsPage]
  )

  const paginatedWhois = useMemo(
    () => paginateRows(sortedWhois, whoisPage, rowsPerPage),
    [sortedWhois, whoisPage]
  )

  const paginatedScans = useMemo(
    () => paginateRows(sortedScans, scansPage, rowsPerPage),
    [sortedScans, scansPage]
  )

  return (
    <main className="dashboard">
      <header className="header">
        <h1>ReconDB</h1>
        <p>Security Asset Intelligence Dashboard</p>
      </header>

      {error && <div className="error">{error}</div>}

      {!summary ? (
        <p>Loading dashboard...</p>
      ) : (
        <section className="cards">
          <div className="card">
            <span>Targets</span>
            <strong>{summary.targets}</strong>
          </div>

          <div className="card">
            <span>Assets</span>
            <strong>{summary.assets}</strong>
          </div>

          <div className="card">
            <span>Open Ports</span>
            <strong>{summary.open_ports}</strong>
          </div>

          <div className="card">
            <span>Vulnerabilities</span>
            <strong>{summary.vulnerabilities}</strong>
          </div>

          <div className="card">
            <span>Domains</span>
            <strong>{summary.domains}</strong>
          </div>

          <div className="card">
            <span>WHOIS Records</span>
            <strong>{summary.whois_records}</strong>
          </div>
        </section>
      )}

      <section className="search-section">
        <label htmlFor="dashboard-search">Search ReconDB</label>
        <input
          id="dashboard-search"
          type="text"
          placeholder="Search targets, ports, services, domains, status..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        {searchTerm && (
          <button type="button" onClick={() => setSearchTerm('')}>
            Clear
          </button>
        )}
      </section>

      <section className="table-section">
        <h2>Targets</h2>

        <button
          type="button"
          className="export-button"
          onClick={() =>
            downloadCsv('recondb-targets.csv', sortedTargets, [
              { label: 'ID', key: 'target_id' },
              { label: 'Target Name', key: 'target_name' },
              { label: 'Type', key: 'target_type' },
            ])
          }
          disabled={sortedTargets.length === 0}
        >
          Export CSV
        </button>

        <table>
          <thead>
            <tr>
              <SortableTh
                label="ID"
                tableName="targets"
                columnKey="target_id"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Target Name"
                tableName="targets"
                columnKey="target_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Type"
                tableName="targets"
                columnKey="target_type"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </tr>
          </thead>

          <tbody>
            {sortedTargets.length === 0 ? (
              <NoResultsRow colSpan={3} />
            ) : (
              paginatedTargets.map((target) => (
                <tr key={target.target_id}>
                  <td>{target.target_id}</td>
                  <td>{target.target_name}</td>
                  <td>{target.target_type}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {sortedTargets.length > rowsPerPage && (
          <PaginationControls
            currentPage={targetsPage}
            totalPages={totalTargetsPages}
            onPrevious={() => setTargetsPage((page) => Math.max(1, page - 1))}
            onNext={() =>
              setTargetsPage((page) => Math.min(totalTargetsPages, page + 1))
            }
          />
        )}
      </section>

      <section className="table-section">
        <h2>Open Ports</h2>

        <button
          type="button"
          className="export-button"
          onClick={() =>
            downloadCsv('recondb-open-ports.csv', sortedPorts, [
              { label: 'Target', key: 'target_name' },
              { label: 'Host', key: 'hostname' },
              { label: 'IP Address', key: 'ip_address' },
              { label: 'Port', key: 'port_number' },
              { label: 'Protocol', key: 'protocol' },
              { label: 'Service', key: 'service_name' },
              { label: 'State', key: 'state' },
            ])
          }
          disabled={sortedPorts.length === 0}
        >
          Export CSV
        </button>

        <table>
          <thead>
            <tr>
              <SortableTh
                label="Target"
                tableName="ports"
                columnKey="target_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Host"
                tableName="ports"
                columnKey="hostname"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="IP Address"
                tableName="ports"
                columnKey="ip_address"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Port"
                tableName="ports"
                columnKey="port_number"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Protocol"
                tableName="ports"
                columnKey="protocol"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Service"
                tableName="ports"
                columnKey="service_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="State"
                tableName="ports"
                columnKey="state"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </tr>
          </thead>

          <tbody>
            {sortedPorts.length === 0 ? (
              <NoResultsRow colSpan={7} />
            ) : (
              paginatedPorts.map((port, index) => (
                <tr
                  key={`${port.target_name}-${port.ip_address}-${port.port_number}-${index}`}
                >
                  <td>{port.target_name}</td>
                  <td>{port.hostname}</td>
                  <td>{port.ip_address}</td>
                  <td>{port.port_number}</td>
                  <td>{port.protocol}</td>
                  <td>{port.service_name}</td>
                  <td>
                    <StatusBadge value={port.state} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {sortedPorts.length > rowsPerPage && (
          <PaginationControls
            currentPage={portsPage}
            totalPages={totalPortsPages}
            onPrevious={() => setPortsPage((page) => Math.max(1, page - 1))}
            onNext={() =>
              setPortsPage((page) => Math.min(totalPortsPages, page + 1))
            }
          />
        )}
      </section>

      <section className="table-section">
        <h2>Domains</h2>

        <button
          type="button"
          className="export-button"
          onClick={() =>
            downloadCsv('recondb-domains.csv', sortedDomains, [
              { label: 'Domain', key: 'domain_name' },
              { label: 'Subdomain', key: 'subdomain_name' },
              { label: 'IP Address', key: 'ip_address' },
              { label: 'Created', key: 'created_at' },
            ])
          }
          disabled={sortedDomains.length === 0}
        >
          Export CSV
        </button>

        <table>
          <thead>
            <tr>
              <SortableTh
                label="Domain"
                tableName="domains"
                columnKey="domain_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Subdomain"
                tableName="domains"
                columnKey="subdomain_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="IP Address"
                tableName="domains"
                columnKey="ip_address"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Created"
                tableName="domains"
                columnKey="created_at"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </tr>
          </thead>

          <tbody>
            {sortedDomains.length === 0 ? (
              <NoResultsRow colSpan={4} />
            ) : (
              paginatedDomains.map((domain, index) => (
                <tr key={`${domain.domain_name}-${domain.ip_address}-${index}`}>
                  <td>{domain.domain_name}</td>
                  <td>{domain.subdomain_name}</td>
                  <td>{domain.ip_address}</td>
                  <td>{formatDate(domain.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {sortedDomains.length > rowsPerPage && (
          <PaginationControls
            currentPage={domainsPage}
            totalPages={totalDomainsPages}
            onPrevious={() => setDomainsPage((page) => Math.max(1, page - 1))}
            onNext={() =>
              setDomainsPage((page) => Math.min(totalDomainsPages, page + 1))
            }
          />
        )}
      </section>

      <section className="table-section">
        <h2>WHOIS Records</h2>

        <button
          type="button"
          className="export-button"
          onClick={() =>
            downloadCsv('recondb-whois.csv', sortedWhois, [
              { label: 'Domain', key: 'domain_name' },
              { label: 'Collected At', key: 'collected_at' },
              { label: 'Preview', key: 'whois_preview' },
            ])
          }
          disabled={sortedWhois.length === 0}
        >
          Export CSV
        </button>

        <table>
          <thead>
            <tr>
              <SortableTh
                label="Domain"
                tableName="whois"
                columnKey="domain_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Collected At"
                tableName="whois"
                columnKey="collected_at"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Preview"
                tableName="whois"
                columnKey="whois_preview"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </tr>
          </thead>

          <tbody>
            {sortedWhois.length === 0 ? (
              <NoResultsRow colSpan={3} />
            ) : (
              paginatedWhois.map((record, index) => (
                <tr key={`${record.domain_name}-${record.collected_at}-${index}`}>
                  <td>{record.domain_name}</td>
                  <td>{formatDate(record.collected_at)}</td>
                  <td>{record.whois_preview}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {sortedWhois.length > rowsPerPage && (
          <PaginationControls
            currentPage={whoisPage}
            totalPages={totalWhoisPages}
            onPrevious={() => setWhoisPage((page) => Math.max(1, page - 1))}
            onNext={() =>
              setWhoisPage((page) => Math.min(totalWhoisPages, page + 1))
            }
          />
        )}
      </section>

      <section className="table-section">
        <h2>Scan History</h2>

        <button
          type="button"
          className="export-button"
          onClick={() =>
            downloadCsv('recondb-scan-history.csv', sortedScans, [
              { label: 'ID', key: 'scan_id' },
              { label: 'Target', key: 'scanTarget' },
              { label: 'OSINT Domain', key: 'osintDomain' },
              { label: 'Ports', key: 'ports' },
              { label: 'Reset Mode', key: 'resetMode' },
              { label: 'Tool', key: 'tool_used' },
              { label: 'Status', key: 'scan_status' },
              { label: 'Completed', key: 'completed_at' },
            ])
          }
          disabled={sortedScans.length === 0}
        >
          Export CSV
        </button>

        <table className="scan-table">
          <thead>
            <tr>
              <SortableTh
                label="ID"
                tableName="scans"
                columnKey="scan_id"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Target"
                tableName="scans"
                columnKey="scanTarget"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="OSINT Domain"
                tableName="scans"
                columnKey="osintDomain"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Ports"
                tableName="scans"
                columnKey="ports"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Reset Mode"
                tableName="scans"
                columnKey="resetMode"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Tool"
                tableName="scans"
                columnKey="tool_used"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Status"
                tableName="scans"
                columnKey="scan_status"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTh
                label="Completed"
                tableName="scans"
                columnKey="completed_at"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </tr>
          </thead>

          <tbody>
            {sortedScans.length === 0 ? (
              <NoResultsRow colSpan={8} />
            ) : (
              paginatedScans.map((scan) => (
                <tr key={scan.scan_id}>
                  <td>{scan.scan_id}</td>
                  <td>{scan.scanTarget}</td>
                  <td>{scan.osintDomain}</td>
                  <td>{scan.ports}</td>
                  <td>
                    <ResetBadge value={scan.resetMode} />
                  </td>
                  <td>{scan.tool_used}</td>
                  <td>
                    <StatusBadge value={scan.scan_status} />
                  </td>
                  <td>{formatDate(scan.completed_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {sortedScans.length > rowsPerPage && (
          <PaginationControls
            currentPage={scansPage}
            totalPages={totalScansPages}
            onPrevious={() => setScansPage((page) => Math.max(1, page - 1))}
            onNext={() =>
              setScansPage((page) => Math.min(totalScansPages, page + 1))
            }
          />
        )}
      </section>
    </main>
  )
}

export default App
