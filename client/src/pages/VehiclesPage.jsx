import { useEffect, useMemo, useState } from 'react';
import { getMe, getVehicles, retireVehicle } from '../api.js';

const initialFilters = {
  q: '',
  status: '',
  type: '',
  region: '',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
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
        const [meResult, vehiclesResult] = await Promise.all([
          getMe(),
          getVehicles(filters),
        ]);

        if (!active) return;
        setUser(meResult);
        setVehicles(vehiclesResult);
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

  const filterOptions = useMemo(() => {
    const types = [...new Set(vehicles.map((vehicle) => vehicle.type))].sort();
    const regions = [...new Set(vehicles.map((vehicle) => vehicle.region))].sort();
    return { types, regions };
  }, [vehicles]);

  const isManager = user?.role === 'Fleet Manager';

  async function handleRetire(vehicle) {
    const confirmed = window.confirm(`Retire ${vehicle.name} (${vehicle.registrationNumber})?`);
    if (!confirmed) return;

    setBusyId(vehicle._id);
    setError('');

    try {
      await retireVehicle(vehicle._id);
      const refreshed = await getVehicles(filters);
      setVehicles(refreshed);
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

  return (
    <main className="vehicles-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Fleet Registry</p>
          <h1>Vehicles</h1>
          <p className="page-copy">
            Review fleet status, narrow by operating context, and retire vehicles from the active pool.
          </p>
        </div>
        <div className="page-header__meta">
          <span className="metric-chip">{vehicles.length} visible</span>
          <span className="metric-chip metric-chip--soft">
            {isManager ? 'Manager controls enabled' : 'Read-only view'}
          </span>
        </div>
      </header>

      <section className="filter-panel">
        <label className="filter-field filter-field--wide">
          Search
          <input
            type="text"
            placeholder="Name or registration number"
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
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </label>

        <label className="filter-field">
          Type
          <select
            value={filters.type}
            onChange={(event) => updateFilter('type', event.target.value)}
          >
            <option value="">All</option>
            {filterOptions.types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          Region
          <select
            value={filters.region}
            onChange={(event) => updateFilter('region', event.target.value)}
          >
            <option value="">All</option>
            {filterOptions.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="table-panel">
        <div className="table-panel__header">
          <h2>Fleet Overview</h2>
          {loading ? <span className="table-state">Loading vehicles...</span> : null}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Registration</th>
                <th>Type</th>
                <th>Region</th>
                <th>Capacity</th>
                <th>Odometer</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">
                    No vehicles matched the current filters.
                  </td>
                </tr>
              ) : null}

              {vehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td>
                    <div className="vehicle-title">
                      <strong>{vehicle.name}</strong>
                    </div>
                  </td>
                  <td>{vehicle.registrationNumber}</td>
                  <td>{vehicle.type}</td>
                  <td>{vehicle.region}</td>
                  <td>{vehicle.maxLoadCapacityKg} kg</td>
                  <td>{vehicle.odometerKm.toLocaleString()} km</td>
                  <td>
                    <span className={`status-badge status-badge--${toStatusTone(vehicle.status)}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td>
                    {isManager && vehicle.status !== 'Retired' ? (
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => handleRetire(vehicle)}
                        disabled={busyId === vehicle._id}
                      >
                        {busyId === vehicle._id ? 'Retiring...' : 'Retire'}
                      </button>
                    ) : (
                      <span className="table-action table-action--muted">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function toStatusTone(status) {
  switch (status) {
    case 'Available':
      return 'available';
    case 'On Trip':
      return 'trip';
    case 'In Shop':
      return 'shop';
    case 'Retired':
      return 'retired';
    default:
      return 'default';
  }
}
