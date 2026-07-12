import { useEffect, useState } from 'react';
import { getDrivers, getMe, updateDriver } from '../api.js';

const initialFilters = {
  q: '',
  status: '',
};

const statusOptions = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [meResult, driversResult] = await Promise.all([
          getMe(),
          getDrivers(filters),
        ]);

        if (!active) return;
        setUser(meResult);
        setDrivers(driversResult);
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filters]);

  const canManageDrivers =
    user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';

  async function handleStatusChange(driver, nextStatus) {
    if (nextStatus === driver.status) return;

    setBusyId(driver._id);
    setError('');

    try {
      await updateDriver(driver._id, { status: nextStatus });
      const refreshed = await getDrivers(filters);
      setDrivers(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const expiringSoonCount = drivers.filter((driver) => daysUntil(driver.licenseExpiryDate) <= 30).length;

  return (
    <main className="drivers-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Roster Control</p>
          <h1>Drivers</h1>
          <p className="page-copy">
            Track assignment status, scan license risk, and manage the dispatchable driver pool.
          </p>
        </div>
        <div className="page-header__meta">
          <span className="metric-chip">{drivers.length} visible</span>
          <span className="metric-chip metric-chip--soft">{expiringSoonCount} expiring soon</span>
        </div>
      </header>

      <section className="filter-panel filter-panel--drivers">
        <label className="filter-field filter-field--wide">
          Search
          <input
            type="text"
            placeholder="Driver name or license number"
            value={filters.q}
            onChange={(event) => updateFilter('q', event.target.value)}
          />
        </label>

        <label className="filter-field">
          Status
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="table-panel">
        <div className="table-panel__header">
          <h2>Driver Roster</h2>
          {loading ? <span className="table-state">Loading drivers...</span> : null}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>License</th>
                <th>Category</th>
                <th>Contact</th>
                <th>Safety Score</th>
                <th>License Expiry</th>
                <th>Status</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {!loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">
                    No drivers matched the current filters.
                  </td>
                </tr>
              ) : null}

              {drivers.map((driver) => {
                const expiry = new Date(driver.licenseExpiryDate);
                const daysRemaining = daysUntil(driver.licenseExpiryDate);

                return (
                  <tr key={driver._id}>
                    <td>
                      <div className="vehicle-title">
                        <strong>{driver.name}</strong>
                      </div>
                    </td>
                    <td>{driver.licenseNumber}</td>
                    <td>{driver.licenseCategory}</td>
                    <td>{driver.contactNumber}</td>
                    <td>{driver.safetyScore}</td>
                    <td>
                      <div className="expiry-cell">
                        <span>{expiry.toLocaleDateString()}</span>
                        <span className={`expiry-note expiry-note--${toExpiryTone(daysRemaining)}`}>
                          {expiryLabel(daysRemaining)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${toDriverStatusTone(driver.status)}`}>
                        {driver.status}
                      </span>
                    </td>
                    <td>
                      {canManageDrivers ? (
                        <select
                          className="table-select"
                          value={driver.status}
                          onChange={(event) => handleStatusChange(driver, event.target.value)}
                          disabled={busyId === driver._id}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {busyId === driver._id && status === driver.status ? 'Saving...' : status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="table-action table-action--muted">Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function daysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryLabel(daysRemaining) {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining <= 30) return `${daysRemaining} days left`;
  return 'Valid';
}

function toExpiryTone(daysRemaining) {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'warning';
  return 'valid';
}

function toDriverStatusTone(status) {
  switch (status) {
    case 'Available':
      return 'available';
    case 'On Trip':
      return 'trip';
    case 'Off Duty':
      return 'default';
    case 'Suspended':
      return 'retired';
    default:
      return 'default';
  }
}
