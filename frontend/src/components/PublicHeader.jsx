/**
 * PublicHeader
 * Simple public navigation using logo from /public.
 */

import { Link } from 'react-router-dom';

const PublicHeader = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src="/hRLogo.jpg" alt="hackerRant" className="h-9 w-9 rounded-lg object-cover" />
          <div className="leading-tight">
            <div className="prefFont text-lg font-extrabold tracking-tight">hackerRant</div>
            <div className="text-xs text-gray-500">secure realtime chat</div>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-gray-700 hover:text-gray-900" to="/login">
            Login
          </Link>
          <Link
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            to="/signup"
          >
            Register
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicHeader;
