import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = 'http://localhost:8000'

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

function StatusBadge({ value }) {
  return <span className={`badge badge-${value}`}>{value}</span>
}

function ResetBadge({ value }) {
  const label = value === 'true' ? 'Reset' : 'No Reset'
  const className = value === 'true' ? 'badge-reset' : 'badge-no-reset'

  return <span className={`badge ${className}`}>{label}</span>
}

function App() {
  const [summary, setSummary] = useState(null)
  const [targets, setTargets] = useState([])
  const [ports, setPorts] = useState([])
  const [domains, setDomains] = useState([])
  const [whois, setWhois] = useState([])
  const [scans, setScans] = useState([])
  const [error, setError] = useState('')

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

      <section className="table-section">
        <h2>Targets</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Target Name</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>
            {targets.map((target) => (
              <tr key={target.target_id}>
                <td>{target.target_id}</td>
                <td>{target.target_name}</td>
                <td>{target.target_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="table-section">
        <h2>Open Ports</h2>

        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Host</th>
              <th>IP Address</th>
              <th>Port</th>
              <th>Protocol</th>
              <th>Service</th>
              <th>State</th>
            </tr>
          </thead>

          <tbody>
            {ports.map((port, index) => (
              <tr key={index}>
                <td>{port.target_name}</td>
                <td>{port.hostname}</td>
                <td>{port.ip_address}</td>
                <td>{port.port_number}</td>
                <td>{port.protocol}</td>
                <td>{port.service_name}</td>
                <td><StatusBadge value={port.state} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="table-section">
        <h2>Domains</h2>

        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Subdomain</th>
              <th>IP Address</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {domains.map((domain, index) => (
              <tr key={index}>
                <td>{domain.domain_name}</td>
                <td>{domain.subdomain_name}</td>
                <td>{domain.ip_address}</td>
                <td>{formatDate(domain.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="table-section">
        <h2>WHOIS Records</h2>

        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Collected At</th>
              <th>Preview</th>
            </tr>
          </thead>

          <tbody>
            {whois.map((record, index) => (
              <tr key={index}>
                <td>{record.domain_name}</td>
                <td>{formatDate(record.collected_at)}</td>
                <td>{record.whois_preview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="table-section">
        <h2>Scan History</h2>

        <table className="scan-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Target</th>
              <th>OSINT Domain</th>
              <th>Ports</th>
              <th>Reset Mode</th>
              <th>Tool</th>
              <th>Status</th>
              <th>Completed</th>
            </tr>
          </thead>

          <tbody>
            {scans.map((scan) => {
              const scope = parseScanScope(scan.scan_scope)

              return (
                <tr key={scan.scan_id}>
                  <td>{scan.scan_id}</td>
                  <td>{scope.scanTarget || scan.target_name}</td>
                  <td>{scope.osintDomain}</td>
                  <td>{scope.ports}</td>
                  <td><ResetBadge value={scope.resetMode} /></td>
                  <td>{scan.tool_used}</td>
                  <td><StatusBadge value={scan.scan_status} /></td>
                  <td>{formatDate(scan.completed_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default App
