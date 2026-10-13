/** Authenticated app shell: glassy, Discord-inspired navigation with a WhatsApp-like chat feel. */
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AggressorWidget from './AggressorWidget.jsx';
import { MessageCircle, CircleDot, MessagesSquare, Search, Library, UserRound, Settings, ShieldAlert, LogOut, Radio } from 'lucide-react';

const items = [
  { to: '/app', label: 'Chats', icon: MessageCircle, end: true },
  { to: '/app/status', label: 'Status', icon: CircleDot },
  { to: '/app/threads', label: 'Threads', icon: MessagesSquare },
  { to: '/app/rantfinder', label: 'RantFinder', icon: Search },
  { to: '/app/ranres', label: 'Ranres', icon: Library },
];
const accountItems = [
  { to: '/app/profile', label: 'Profile', icon: UserRound },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/complains', label: 'Complains', icon: ShieldAlert },
];
const navItem = ({ isActive }) => `hr-nav-item ${isActive ? 'is-active' : ''}`;

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const username = user?.username || 'user';
  return (
    <div className="hr-app-bg min-h-screen">
      <div className="hr-app-shell">
        <aside className="hr-sidebar glass-panel">
          <Link to="/app" className="hr-brand" aria-label="hackerRant home">
            <img src="/hRLogo.jpg" alt="" className="hr-brand-logo" />
            <span className="min-w-0"><strong className="prefFont">hackerRant</strong><small>YOUR SPACE. YOUR VOICE.</small></span>
            <span className="hr-live-dot" title="App available" />
          </Link>
          <div className="hr-sidebar-label">WORKSPACE</div>
          <nav className="hr-nav" aria-label="Main navigation">
            {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={navItem}><Icon size={18} strokeWidth={1.9} /><span>{label}</span>{label === 'Chats' && <span className="hr-nav-pill">DMs</span>}</NavLink>)}
          </nav>
          <div className="hr-sidebar-label hr-sidebar-label-spaced">YOUR ACCOUNT</div>
          <nav className="hr-nav" aria-label="Account navigation">
            {accountItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={navItem}><Icon size={18} strokeWidth={1.9} /><span>{label}</span></NavLink>)}
          </nav>
          <div className="hr-sidebar-bottom">
            <div className="hr-user-card"><div className="hr-avatar">{username.slice(0, 1).toUpperCase()}</div><div className="hr-user-meta"><strong>{username}</strong><small><span className="hr-online-dot" /> Connected</small></div><button type="button" className="hr-icon-button" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={17} /></button></div>
            <div className="hr-security-note"><Radio size={15} /><span>Privacy-minded by design</span></div>
          </div>
        </aside>
        <main className="hr-main glass-panel"><div className="hr-main-topline"><div><span className="hr-eyebrow">HACKERRANT / COMMUNITY</span><span className="hr-top-status"><span className="hr-online-dot" /> All systems ready</span></div><span className="hr-top-tag">STAY CURIOUS<span>✳</span></span></div><div className="hr-page-content"><Outlet /></div></main>
      </div>
      <AggressorWidget />
    </div>
  );
}
