/** One row in the chat list. */
import { Link } from 'react-router-dom';
import { formatTime } from '../../utils/formatTime.js';

const ChatListItem = ({ chat, myId }) => {
  const last = chat.lastMessage;
  const preview = last ? `${last.senderId === myId ? 'You: ' : ''}${last.text}` : 'No messages yet';

  return (
    <Link
      to={`/app/chat/${chat.id}`}
      state={{ title: chat.title }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.07]"
    >
      <div className="hr-avatar">{chat.title.replace('@', '').slice(0, 1).toUpperCase()}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <strong className="truncate text-sm text-gray-100">{chat.title}</strong>
          <span className="shrink-0 text-xs text-gray-500">{formatTime(last?.created_at)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className={`truncate text-xs ${chat.unreadCount ? 'text-gray-200' : 'text-gray-500'}`}>
            {preview}
          </span>
          {chat.unreadCount > 0 ? (
            <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default ChatListItem;
