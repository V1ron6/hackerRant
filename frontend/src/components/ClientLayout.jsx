/**
 * ClientLayout
 * Authenticated app shell (WhatsApp-like left nav + content).
 */

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AggressorWidget from './AggressorWidget.jsx';

const navItem = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
  }`;

const ClientLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-black/5 bg-white p-4">
          <Link to="/app" className="mb-4 flex items-center gap-3">
            <img src="/hRLogo.jpg" alt="hackerRant" className="h-10 w-10 rounded-xl object-cover" />
            <div className="leading-tight">
              <div className="prefFont text-xl font-extrabold">hackerRant</div>
              <div className="text-xs text-gray-500">@{user?.username || 'user'}</div>
            </div>
          </Link>

          <nav className="flex flex-col gap-1">
            <NavLink to="/app" end className={navItem}>Chats</NavLink>
            <NavLink to="/app/status" className={navItem}>Status</NavLink>
            <NavLink to="/app/threads" className={navItem}>Threads</NavLink>
            <NavLink to="/app/rantfinder" className={navItem}>RantFinder</NavLink>
            <NavLink to="/app/ranres" className={navItem}>Ranres</NavLink>
            <NavLink to="/app/profile" className={navItem}>Profile</NavLink>
            <NavLink to="/app/settings" className={navItem}>Settings</NavLink>
            <NavLink to="/app/complains" className={navItem}>Complains</NavLink>
          </nav>

          <button
            onClick={logout}
            className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Logout
          </button>
        </aside>

        <main className="rounded-2xl border border-black/5 bg-white">
          <Outlet />
        </main>
      </div>

      <AggressorWidget />
    </div>
  );
};

export default ClientLayout;
