/** Someone else's profile (route: /app/u/:username) — read-only, with a Message button. */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { chatService, getErrorMessage, userService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useLoad from '../../hooks/useLoad.js';
import Avatar from '../../components/Avatar.jsx';
import Notice from '../../components/Notice.jsx';

const PublicProfile = () => {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useLoad(async () => (await userService.getProfile(username)).data, [username]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const isMe = data && data.id === me.id;
  const fullName = data ? [data.first_name, data.last_name].filter(Boolean).join(' ') : '';

  const message = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await chatService.create(data.username);
      navigate(`/app/chat/${res.data.id}`, { state: { title: `@${data.username}` } });
    } catch (e) {
      setErr(getErrorMessage(e));
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Link to={-1} onClick={(e) => { e.preventDefault(); navigate(-1); }} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back
      </Link>

      {loading ? (
        <p className="text-sm">Loading profile…</p>
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center sm:p-8">
          <div className="flex justify-center"><Avatar src={data.avatar_url} name={data.username} size={96} /></div>
          <h1 className="prefFont mt-4 break-words text-2xl font-extrabold">@{data.username}</h1>
          {fullName ? <div className="mt-1 text-sm text-gray-300">{fullName}</div> : null}
          {data.bio ? <p className="mx-auto mt-4 max-w-md whitespace-pre-wrap break-words text-sm">{data.bio}</p> : <p className="mt-4 text-sm italic text-gray-500">No bio yet.</p>}
          <div className="mt-3 text-xs text-gray-500">Joined {new Date(data.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          <div className="mt-5">
            {isMe ? (
              <Link to="/app/profile" className="inline-block rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-200">Edit your profile</Link>
            ) : (
              <button type="button" onClick={message} disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                <MessageCircle size={16} /> {busy ? 'Opening…' : 'Message'}
              </button>
            )}
          </div>
          <Notice tone="error" className="mt-4">{err}</Notice>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
