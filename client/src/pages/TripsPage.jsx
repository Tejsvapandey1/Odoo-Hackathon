import { useEffect, useState } from 'react';
import {
  cancelTrip,
  completeTrip,
  createTrip,
  dispatchTrip,
  getAvailableDrivers,
  getAvailableVehicles,
  getMe,
  getTrips,
} from '../api.js';

const initialFilters = {
  status: '',
};

const initialForm = {
  source: '',
  destination: '',
  vehicle: '',
  driver: '',
  cargoWeightKg: '',
  plannedDistanceKm: '',
};

const initialCompleteForm = {
  actualDistanceKm: '',
  fuelConsumedL: '',
  revenue: '',
  finalOdometerKm: '',
};

export default function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [completeForms, setCompleteForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [meResult, tripsResult, vehiclesResult, driversResult] = await Promise.all([
          getMe(),
          getTrips(filters),
          getAvailableVehicles(),
          getAvailableDrivers(),
        ]);

        if (!active) return;
        setUser(meResult);
        setTrips(tripsResult);
        setAvailableVehicles(vehiclesResult);
        setAvailableDrivers(driversResult);
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

  const isManager = user?.role === 'Fleet Manager';

  async function refreshTrips() {
    const [tripsResult, vehiclesResult, driversResult] = await Promise.all([
      getTrips(filters),
      getAvailableVehicles(),
      getAvailableDrivers(),
    ]);

    setTrips(tripsResult);
    setAvailableVehicles(vehiclesResult);
    setAvailableDrivers(driversResult);
  }

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCompleteForm(id, key, value) {
    setCompleteForms((current) => ({
      ...current,
      [id]: {
        ...(current[id] || initialCompleteForm),
        [key]: value,
      },
    }));
  }

  async function handleCreateTrip(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await createTrip({
        source: form.source,
        destination: form.destination,
        vehicle: form.vehicle,
        driver: form.driver,
        cargoWeightKg: Number(form.cargoWeightKg),
        plannedDistanceKm: Number(form.plannedDistanceKm),
      });
      setForm(initialForm);
      await refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDispatch(id) {
    setBusyId(id);
    setError('');

    try {
      await dispatchTrip(id);
      await refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function handleCancel(id) {
    setBusyId(id);
    setError('');

    try {
      await cancelTrip(id);
      await refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function handleComplete(id) {
    setBusyId(id);
    setError('');

    const values = completeForms[id] || initialCompleteForm;

    try {
      await completeTrip(id, {
        actualDistanceKm: toNumber(values.actualDistanceKm),
        fuelConsumedL: toNumber(values.fuelConsumedL),
        revenue: toNumber(values.revenue),
        finalOdometerKm: toNumber(values.finalOdometerKm),
      });
      setCompleteForms((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await refreshTrips();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <main className="trips-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dispatch Board</p>
          <h1>Trips</h1>
          <p className="page-copy">
            Create draft trips, dispatch available vehicles and drivers, then close the loop with completion or cancellation.
          </p>
        </div>
        <div className="page-header__meta">
          <span className="metric-chip">{trips.length} visible</span>
          <span className="metric-chip metric-chip--soft">
            {availableVehicles.length} vehicles ready
          </span>
        </div>
      </header>

      {error ? <p className="form-error">{error}</p> : null}

      {isManager ? (
        <section className="compose-panel">
          <div className="table-panel__header">
            <h2>Create Draft Trip</h2>
          </div>
          <form className="trip-form" onSubmit={handleCreateTrip}>
            <label className="filter-field">
              Source
              <input
                type="text"
                value={form.source}
                onChange={(event) => updateForm('source', event.target.value)}
                required
              />
            </label>
            <label className="filter-field">
              Destination
              <input
                type="text"
                value={form.destination}
                onChange={(event) => updateForm('destination', event.target.value)}
                required
              />
            </label>
            <label className="filter-field">
              Vehicle
              <select
                value={form.vehicle}
                onChange={(event) => updateForm('vehicle', event.target.value)}
                required
              >
                <option value="">Select vehicle</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.name} ({vehicle.registrationNumber})
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              Driver
              <select
                value={form.driver}
                onChange={(event) => updateForm('driver', event.target.value)}
                required
              >
                <option value="">Select driver</option>
                {availableDrivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} ({driver.licenseNumber})
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              Cargo Weight (kg)
              <input
                type="number"
                min="1"
                value={form.cargoWeightKg}
                onChange={(event) => updateForm('cargoWeightKg', event.target.value)}
                required
              />
            </label>
            <label className="filter-field">
              Planned Distance (km)
              <input
                type="number"
                min="0"
                value={form.plannedDistanceKm}
                onChange={(event) => updateForm('plannedDistanceKm', event.target.value)}
                required
              />
            </label>
            <button type="submit" className="primary-button trip-form__submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Draft'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="filter-panel filter-panel--trips">
        <label className="filter-field">
          Status
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">All</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
      </section>

      <section className="table-panel">
        <div className="table-panel__header">
          <h2>Trip Queue</h2>
          {loading ? <span className="table-state">Loading trips...</span> : null}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {!loading && trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    No trips matched the current filter.
                  </td>
                </tr>
              ) : null}

              {trips.map((trip) => {
                const completeValues = completeForms[trip._id] || initialCompleteForm;

                return (
                  <tr key={trip._id}>
                    <td>
                      <div className="vehicle-title">
                        <strong>{trip.source} {'->'} {trip.destination}</strong>
                      </div>
                    </td>
                    <td>{trip.vehicle?.name || 'Unknown vehicle'}</td>
                    <td>{trip.driver?.name || 'Unknown driver'}</td>
                    <td>{trip.cargoWeightKg} kg</td>
                    <td>
                      {trip.status === 'Completed'
                        ? `${trip.actualDistanceKm} / ${trip.plannedDistanceKm} km`
                        : `${trip.plannedDistanceKm} km planned`}
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${toTripStatusTone(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td>
                      {isManager ? (
                        <div className="trip-actions">
                          {trip.status === 'Draft' ? (
                            <>
                              <button
                                type="button"
                                className="table-action table-action--positive"
                                onClick={() => handleDispatch(trip._id)}
                                disabled={busyId === trip._id}
                              >
                                {busyId === trip._id ? 'Working...' : 'Dispatch'}
                              </button>
                              <button
                                type="button"
                                className="table-action"
                                onClick={() => handleCancel(trip._id)}
                                disabled={busyId === trip._id}
                              >
                                Cancel
                              </button>
                            </>
                          ) : null}

                          {trip.status === 'Dispatched' ? (
                            <div className="complete-card">
                              <div className="complete-card__grid">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Actual km"
                                  value={completeValues.actualDistanceKm}
                                  onChange={(event) =>
                                    updateCompleteForm(trip._id, 'actualDistanceKm', event.target.value)
                                  }
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Fuel L"
                                  value={completeValues.fuelConsumedL}
                                  onChange={(event) =>
                                    updateCompleteForm(trip._id, 'fuelConsumedL', event.target.value)
                                  }
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Revenue"
                                  value={completeValues.revenue}
                                  onChange={(event) =>
                                    updateCompleteForm(trip._id, 'revenue', event.target.value)
                                  }
                                />
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Final odometer"
                                  value={completeValues.finalOdometerKm}
                                  onChange={(event) =>
                                    updateCompleteForm(trip._id, 'finalOdometerKm', event.target.value)
                                  }
                                />
                              </div>
                              <div className="trip-actions">
                                <button
                                  type="button"
                                  className="table-action table-action--positive"
                                  onClick={() => handleComplete(trip._id)}
                                  disabled={busyId === trip._id}
                                >
                                  {busyId === trip._id ? 'Completing...' : 'Complete'}
                                </button>
                                <button
                                  type="button"
                                  className="table-action"
                                  onClick={() => handleCancel(trip._id)}
                                  disabled={busyId === trip._id}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}

                          {trip.status === 'Completed' ? (
                            <div className="trip-summary">
                              <span>{trip.fuelConsumedL} L fuel</span>
                              <span>{trip.revenue} revenue</span>
                            </div>
                          ) : null}

                          {trip.status === 'Cancelled' ? (
                            <span className="table-action table-action--muted">Cancelled</span>
                          ) : null}
                        </div>
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

function toNumber(value) {
  return value === '' ? undefined : Number(value);
}

function toTripStatusTone(status) {
  switch (status) {
    case 'Draft':
      return 'default';
    case 'Dispatched':
      return 'trip';
    case 'Completed':
      return 'available';
    case 'Cancelled':
      return 'retired';
    default:
      return 'default';
  }
}
