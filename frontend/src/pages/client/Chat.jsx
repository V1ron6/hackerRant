/** Chat detail (route: /app/chat/:chatId) — realtime conversation with one user. */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useChatMessages from '../../hooks/useChatMessages.js';
import { chatService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import MessageBubble from '../../components/chat/MessageBubble.jsx';
import MessageComposer from '../../components/chat/MessageComposer.jsx';

const NEAR_BOTTOM_PX = 120;

const Chat = () => {
  const { chatId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { messages, loading, error, typing, hasMore, send, notifyTyping, loadOlder } =
    useChatMessages(chatId);

  // The messages endpoint has no chat meta; the list passes the title via router state.
  const [title, setTitle] = useState(location.state?.title || '');
  useEffect(() => {
    if (title) return;
    chatService
      .list()
      .then((res) => setTitle(res.data.find((c) => c.id === chatId)?.title || 'Chat'))
      .catch(() => setTitle('Chat'));
  }, [chatId, title]);

  const listRef = useRef(null);
  const stickToBottom = useRef(true);

  const onScroll = () => {
    const el = listRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  // Follow new messages only while the reader is already at the bottom.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const onLoadOlder = async () => {
    const el = listRef.current;
    const before = el.scrollHeight;
    stickToBottom.current = false;
    await loadOlder();
    requestAnimationFrame(() => {
      el.scrollTop += el.scrollHeight - before; // keep the reader's place
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-220px)] min-h-[420px] max-w-2xl flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <Link to="/app" aria-label="Back to chats" className="hr-icon-button">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="prefFont text-lg font-extrabold">{title || '…'}</h1>
      </div>

      <div ref={listRef} onScroll={onScroll} className="flex-1 space-y-2 overflow-y-auto py-4">
        {loading ? (
          <p className="text-center text-sm">Loading messages…</p>
        ) : error ? (
          <div className="text-center text-sm">
            <p className="!text-red-400">{error}</p>
            <Link to="/app" className="mt-2 inline-block text-red-400 underline">
              Back to chats
            </Link>
          </div>
        ) : (
          <>
            {hasMore ? (
              <div className="text-center">
                <button type="button" onClick={onLoadOlder} className="text-xs text-red-400 underline">
                  Load earlier messages
                </button>
              </div>
            ) : null}
            {messages.length === 0 ? (
              <p className="text-center text-sm">No messages yet. Say hi.</p>
            ) : null}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} mine={m.senderId === user.id} />
            ))}
          </>
        )}
      </div>

      <div className="h-5 text-xs italic text-gray-500">{typing ? `${title} is typing…` : ''}</div>

      {!error ? <MessageComposer onSend={send} onTyping={notifyTyping} /> : null}
    </div>
  );
};

export default Chat;
