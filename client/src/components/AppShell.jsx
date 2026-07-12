import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../api.js';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/trips', label: 'Trips' },
];

export default function AppShell() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <p className="eyebrow">TransitOps</p>
          <h1>Control Tower</h1>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div>
            <p className="sidebar__user-label">Signed in</p>
            <strong>{user?.name || 'TransitOps User'}</strong>
            <p className="sidebar__user-role">{user?.role || 'Unknown role'}</p>
          </div>
          <button type="button" className="ghost-button ghost-button--sidebar" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-shell__content">
        <Outlet />
      </div>
    </div>
  );
}
