/** Chat home: all my chats, newest activity first, plus a way to start a new one. */
import useChats from '../../hooks/useChats.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ChatListItem from '../../components/chat/ChatListItem.jsx';
import NewChatForm from '../../components/chat/NewChatForm.jsx';

const Homefeed = () => {
  const { user } = useAuth();
  const { chats, loading, error } = useChats();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="prefFont text-2xl font-extrabold">Chats</h1>

      <div className="mt-4">
        <NewChatForm />
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm">Loading chats…</p>
        ) : error ? (
          <p className="text-sm !text-red-400">{error}</p>
        ) : chats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm">
            No chats yet. Enter a username above to start one.
          </div>
        ) : (
          chats.map((chat) => <ChatListItem key={chat.id} chat={chat} myId={user.id} />)
        )}
      </div>
    </div>
  );
};

export default Homefeed;
