/** My profile (route: /app/profile) — edit name, bio, birthday and picture. */
import { useRef, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage, uploadService, userService } from '../../services/api.js';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const BIO_MAX = 500;
const field = 'w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-red-400/60';
const label = 'mb-1 block text-xs font-semibold uppercase tracking-wide !text-gray-400';

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    bio: user.bio || '',
    dob: user.dob ? String(user.dob).slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ tone: 'info', text: '' });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const merge = (data) => setUser((u) => ({ ...u, ...data }));

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setMsg({ tone: 'info', text: '' });
    try {
      const up = await uploadService.upload(file, 'avatar');
      const res = await userService.updateProfile({ avatar_url: up.data.url });
      merge(res.data);
      setMsg({ tone: 'success', text: 'Profile picture updated.' });
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  };

  const onRemovePhoto = async () => {
    setUploading(true);
    try {
      const res = await userService.updateProfile({ avatar_url: '' });
      merge(res.data);
      setMsg({ tone: 'success', text: 'Profile picture removed.' });
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ tone: 'info', text: '' });
    try {
      const res = await userService.updateProfile(form);
      merge(res.data);
      setMsg({ tone: 'success', text: 'Profile saved.' });
    } catch (err) {
      setMsg({ tone: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" subtitle="This is what other people see when they open your profile." icon={UserRound} />

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Avatar src={user.avatar_url} name={user.username} size={72} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-bold text-gray-100">@{user.username}</div>
          <div className="truncate text-sm text-gray-500">{user.email}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onPick} aria-label="Upload profile picture" />
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
            <Camera size={16} /> {uploading ? 'Uploading…' : 'Change photo'}
          </button>
          {user.avatar_url ? (
            <button type="button" disabled={uploading} onClick={onRemovePhoto}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 disabled:opacity-60">Remove</button>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className={label}>First name</label>
            <input id="first_name" className={field} value={form.first_name} onChange={set('first_name')} maxLength={50} autoComplete="given-name" />
          </div>
          <div>
            <label htmlFor="last_name" className={label}>Last name</label>
            <input id="last_name" className={field} value={form.last_name} onChange={set('last_name')} maxLength={50} autoComplete="family-name" />
          </div>
        </div>
        <div>
          <label htmlFor="dob" className={label}>Date of birth</label>
          <input id="dob" type="date" className={field} value={form.dob} onChange={set('dob')} max={new Date().toISOString().slice(0, 10)} autoComplete="bday" />
        </div>
        <div>
          <label htmlFor="bio" className={label}>Bio</label>
          <textarea id="bio" rows={4} className={`${field} resize-y`} value={form.bio} onChange={set('bio')} maxLength={BIO_MAX} placeholder="Tell people what you rant about…" />
          <div className="mt-1 text-right text-xs text-gray-500">{form.bio.length}/{BIO_MAX}</div>
        </div>
        <Notice tone={msg.tone}>{msg.text}</Notice>
        <button type="submit" disabled={saving}
          className="w-full rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
