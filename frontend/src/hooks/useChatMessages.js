/**
 * useChatMessages
 * Messages for one chat: history + cursor paging, realtime receive, send
 * (socket with ack, REST fallback), typing indicator and read receipts.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService, getErrorMessage } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { useAuth } from '../context/AuthContext.jsx';

const TYPING_REPEAT_MS = 2000;
const TYPING_IDLE_MS = 2500;
const TYPING_SHOW_MS = 3500;
const ACK_TIMEOUT_MS = 8000;

const useChatMessages = (chatId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typing, setTyping] = useState(false);

  const showTimer = useRef(null);
  const idleTimer = useRef(null);
  const lastTypingSent = useRef(0);

  // The server pushes our own sends back too (multi-device), so dedupe by id.
  const add = useCallback((m) => {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }, []);

  // History
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setNextCursor(null);
    setLoading(true);
    setError('');

    chatService
      .messages(chatId)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages);
        setNextCursor(res.data.nextCursor);
        getSocket().emit('message:read', { chatId });
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  // Realtime
  useEffect(() => {
    const socket = getSocket();

    const onReceive = (m) => {
      if (m.chatId !== chatId) return;
      add(m);
      setTyping(false);
      if (m.senderId !== user.id) socket.emit('message:read', { chatId });
    };
    const onTypingStart = (p) => {
      if (p.chatId !== chatId) return;
      setTyping(true);
      clearTimeout(showTimer.current);
      showTimer.current = setTimeout(() => setTyping(false), TYPING_SHOW_MS);
    };
    const onTypingStop = (p) => {
      if (p.chatId === chatId) setTyping(false);
    };

    socket.on('message:receive', onReceive);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    return () => {
      socket.off('message:receive', onReceive);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      clearTimeout(showTimer.current);
      clearTimeout(idleTimer.current);
    };
  }, [chatId, user.id, add]);

  const send = useCallback(
    async (text) => {
      const socket = getSocket();

      if (socket.connected) {
        const ack = await new Promise((resolve) => {
          socket.timeout(ACK_TIMEOUT_MS).emit('message:send', { chatId, text }, (err, res) => {
            resolve(err ? { ok: false, error: 'No response from the server' } : res);
          });
        });
        if (!ack?.ok) throw new Error(ack?.error || 'Failed to send');
        add(ack.message);
        return;
      }

      const res = await chatService.send(chatId, text);
      add(res.data);
    },
    [chatId, add]
  );

  const notifyTyping = useCallback(() => {
    const socket = getSocket();
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_REPEAT_MS) {
      socket.emit('typing:start', { chatId });
      lastTypingSent.current = now;
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { chatId });
      lastTypingSent.current = 0;
    }, TYPING_IDLE_MS);
  }, [chatId]);

  const loadOlder = useCallback(async () => {
    if (!nextCursor) return;
    const res = await chatService.messages(chatId, { cursor: nextCursor });
    setMessages((prev) => [...res.data.messages, ...prev]);
    setNextCursor(res.data.nextCursor);
  }, [chatId, nextCursor]);

  return { messages, loading, error, typing, hasMore: !!nextCursor, send, notifyTyping, loadOlder };
};

export default useChatMessages;
