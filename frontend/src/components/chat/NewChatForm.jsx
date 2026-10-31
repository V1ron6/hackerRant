/** Start a chat by typing someone's username. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { chatService, getErrorMessage } from '../../services/api.js';

const NewChatForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = username.trim().replace(/^@/, '');
    if (!name) return;

    setLoading(true);
    setError('');
    try {
      const res = await chatService.create(name);
      navigate(`/app/chat/${res.data.id}`, { state: { title: res.data.title } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300/40"
          placeholder="Start a chat — enter @username"
          maxLength={31}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <UserPlus size={16} />
          <span>{loading ? 'Opening…' : 'Chat'}</span>
        </button>
      </div>
      {error ? <div className="mt-2 text-sm text-red-400">{error}</div> : null}
    </form>
  );
};

export default NewChatForm;
