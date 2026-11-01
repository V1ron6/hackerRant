/** Settings (route: /app/settings) — preferences, devices, and account actions. */
import { useState } from 'react';
import { Bell, KeyRound, LogOut, MapPin, MonitorSmartphone, Palette, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { authService, clearSessionHint, getErrorMessage, sessionService, userService } from '../../services/api.js';
import { closeSocket } from '../../services/socket.js';
import { CHAT_THEMES } from '../../utils/chatThemes.js';
import useLoad from '../../hooks/useLoad.js';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatTime } from '../../utils/formatTime.js';

const Section = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
    <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><Icon size={18} className="text-red-400" />{title}</h2>
    {children}
  </section>
);

const Toggle = ({ checked, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-red-500' : 'bg-white/15'} disabled:opacity-60`}>
    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
);

const Row = ({ title, desc, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0"><div className="text-sm font-semibold text-gray-100">{title}</div><p className="mt-0.5 text-xs">{desc}</p></div>
    {children}
  </div>
);

const shortAgent = (ua = '') => {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  return `${browser} on ${os}`;
};

const Settings = () => {
  const { logout, setUser } = useAuth();
  const { settings, update } = useSettings();
  const [msg, setMsg] = useState({ tone: 'info', text: '' });
  const [busy, setBusy] = useState('');
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sessions = useLoad(async () => (await sessionService.getSessions()).data, []);

  const say = (tone, text) => setMsg({ tone, text });
  const run = async (key, fn, okText) => {
    setBusy(key);
    say('info', '');
    try {
      await fn();
      if (okText) say('success', okText);
    } catch (err) {
      say('error', getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const onNotifications = (on) => run('notif', async () => {
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    await update({ notifications: on });
    if (on && typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      say('info', 'Notifications are on, but your browser is blocking them. Allow them in the site settings to see alerts.');
    }
  });

  const updateLocation = () => run('loc', () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Your browser does not support location.'));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await userService.updateProfile({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          resolve();
        } catch (e) { reject(e); }
      },
      () => reject(new Error('Location permission was denied.')),
      { timeout: 10000 }
    );
  }), 'Location updated (rounded to roughly 1 km).');

  const endLocalSession = () => { clearSessionHint(); closeSocket(); setUser(null); };

  const signOutAll = () => run('all', async () => {
    await sessionService.revokeAllSessions();
    endLocalSession();
  });

  const changeTicket = () => run('ticket', async () => {
    await authService.changeTicket();
    await sessions.reload();
  }, 'New ticket issued for this device.');

  const revoke = (id) => run(`s-${id}`, async () => {
    await sessionService.revokeSession(id);
    await sessions.reload();
  }, 'Device signed out.');

  const deleteAccount = (e) => {
    e.preventDefault();
    return run('del', async () => {
      await userService.deleteAccount(password);
      endLocalSession();
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Settings" subtitle="Notifications, appearance, privacy and your devices." icon={SettingsIcon} />
      <Notice tone={msg.tone}>{msg.text}</Notice>

      <Section icon={Bell} title="Notifications">
        <Row title="Message alerts" desc="Show a browser notification when a message arrives while this tab is in the background.">
          <Toggle checked={settings.notifications} onChange={onNotifications} label="Message alerts" disabled={busy === 'notif'} />
        </Row>
      </Section>

      <Section icon={Palette} title="Chat theme">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Chat theme">
          {Object.entries(CHAT_THEMES).map(([key, t]) => (
            <button key={key} type="button" role="radio" aria-checked={settings.chat_theme === key}
              onClick={() => run('theme', () => update({ chat_theme: key }))}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${settings.chat_theme === key ? 'border-red-400/60 bg-white/[0.08] text-white' : 'border-white/10 text-gray-300'}`}>
              <span className={`h-4 w-4 rounded-full ${t.swatch}`} />{t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={MapPin} title="Location">
        <Row title="Let people find me nearby" desc="Off by default. Only a rough position (about 1 km) is stored and nobody ever sees it: people only see a distance. Turning this off erases it.">
          <Toggle checked={settings.share_location} onChange={(on) => run('share', () => update({ share_location: on }))} label="Share my location" disabled={busy === 'share'} />
        </Row>
        {settings.share_location ? (
          <button type="button" onClick={updateLocation} disabled={busy === 'loc'}
            className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 disabled:opacity-60">
            {busy === 'loc' ? 'Locating…' : 'Update my location now'}
          </button>
        ) : null}
      </Section>

      <Section icon={MonitorSmartphone} title="Your devices">
        {sessions.loading ? <p className="text-sm">Loading…</p> : sessions.error ? <Notice tone="error">{sessions.error}</Notice> : (
          <ul className="space-y-2">
            {(sessions.data || []).length === 0 ? <li className="text-sm">No active sessions.</li> : null}
            {(sessions.data || []).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-100">{shortAgent(s.user_agent)}</div>
                  <div className="truncate text-xs text-gray-500">{s.ip_address || 'unknown IP'} · active {formatTime(s.last_active_at)}</div>
                </div>
                <button type="button" onClick={() => revoke(s.id)} disabled={busy === `s-${s.id}`}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 disabled:opacity-60">Sign out</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section icon={KeyRound} title="Account security">
        <Row title="Change ticket" desc="Replace this device's login ticket. Use it if you think it was exposed.">
          <button type="button" onClick={changeTicket} disabled={busy === 'ticket'}
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 disabled:opacity-60">Change</button>
        </Row>
        <div className="my-3 h-px bg-white/10" />
        <Row title="Sign out everywhere" desc="Ends every session on every device, including this one.">
          <button type="button" onClick={signOutAll} disabled={busy === 'all'}
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 disabled:opacity-60">Sign out all</button>
        </Row>
        <div className="my-3 h-px bg-white/10" />
        <Row title="Log out" desc="Sign out of this device only.">
          <button type="button" onClick={() => logout().catch(() => {})}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200"><LogOut size={14} />Log out</button>
        </Row>
      </Section>

      <section className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] p-4 sm:p-5">
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold !text-red-300"><Trash2 size={18} />Delete account</h2>
        <p className="text-xs">Permanently removes your personal data and signs you out everywhere. This cannot be undone.</p>
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300">Delete my account…</button>
        ) : (
          <form onSubmit={deleteAccount} className="mt-3 space-y-3">
            <label htmlFor="del-pw" className="block text-xs font-semibold uppercase tracking-wide !text-gray-400">Confirm with your password</label>
            <input id="del-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60" required />
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy === 'del' || !password} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {busy === 'del' ? 'Deleting…' : 'Permanently delete'}
              </button>
              <button type="button" onClick={() => { setConfirmDelete(false); setPassword(''); }} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300">Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default Settings;
