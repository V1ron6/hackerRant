/** Message input. Enter sends, Shift+Enter inserts a newline. */
import { useState } from 'react';
import { Send } from 'lucide-react';

const MAX_LENGTH = 4000;

const MessageComposer = ({ onSend, onTyping }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;

    setSending(true);
    setError('');
    try {
      await onSend(value);
      setText('');
    } catch (err) {
      setError(err?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div>
      {error ? <div className="mb-2 text-sm text-red-400">{error}</div> : null}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Type a message"
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-300/40"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending || !text.trim()}
          aria-label="Send message"
          className="grid h-[42px] w-[42px] place-items-center rounded-lg bg-red-500 text-white disabled:opacity-60"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
