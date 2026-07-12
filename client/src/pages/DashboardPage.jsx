import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../components/KpiCard.jsx';
import { clearSession, getDashboard, getHealth, getMe, getStoredUser } from '../api.js';

const initialStats = {
  activeVehicles: 0,
  availableVehicles: 0,
  inShopVehicles: 0,
  activeTrips: 0,
  pendingTrips: 0,
  driversOnDuty: 0,
  fleetUtilization: 0,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [health, setHealth] = useState('checking');
  const [user, setUser] = useState(getStoredUser());
  const [stats, setStats] = useState(initialStats);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [healthResult, meResult, dashboardResult] = await Promise.all([
          getHealth(),
          getMe(),
          getDashboard(),
        ]);

        if (!active) return;
        setHealth(healthResult.status);
        setUser(meResult);
        setStats(dashboardResult);
      } catch (err) {
        if (!active) return;
        setError(err.message);
        if (/token|unauth/i.test(err.message)) {
          clearSession();
          navigate('/login', { replace: true });
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Operations Snapshot</p>
          <h1>TransitOps Dashboard</h1>
        </div>
        <div className="topbar__actions">
          <span className={`status-dot status-dot--${health === 'ok' ? 'live' : 'idle'}`}>
            API {health}
          </span>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className="welcome-panel">
        <div>
          <p className="welcome-panel__label">Signed in as</p>
          <h2>{user?.name || 'TransitOps User'}</h2>
          <p className="welcome-panel__meta">{user?.role || 'Loading role...'}</p>
        </div>
        <div className="welcome-panel__callout">
          <strong>Current milestone</strong>
          <p>
            Frontend scaffold is live. Next steps can branch into role-based screens, tables,
            and form flows on top of this shell.
          </p>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="kpi-grid">
        <KpiCard label="Active Vehicles" value={stats.activeVehicles} tone="warm" />
        <KpiCard label="Available Vehicles" value={stats.availableVehicles} tone="cool" />
        <KpiCard label="In Shop" value={stats.inShopVehicles} tone="neutral" />
        <KpiCard label="Active Trips" value={stats.activeTrips} tone="warm" />
        <KpiCard label="Pending Trips" value={stats.pendingTrips} tone="neutral" />
        <KpiCard label="Drivers On Duty" value={stats.driversOnDuty} tone="cool" />
        <KpiCard
          label="Fleet Utilization"
          value={`${stats.fleetUtilization}%`}
          tone="accent"
        />
      </section>

      <section className="info-grid">
        <article className="info-panel">
          <h3>What works now</h3>
          <ul>
            <li>JWT login against the Express API</li>
            <li>Session persistence with local storage</li>
            <li>Protected routing for authenticated screens</li>
            <li>Live KPI fetch from `/api/reports/dashboard`</li>
          </ul>
        </article>
        <article className="info-panel">
          <h3>Good next frontend slices</h3>
          <ul>
            <li>Vehicle table with filters and retire action</li>
            <li>Driver management with expiry visibility</li>
            <li>Trip creation and dispatch workflow</li>
            <li>Maintenance and financial report screens</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
