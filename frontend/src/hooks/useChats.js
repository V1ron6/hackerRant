/**
 * useChats
 * My chat list. Any incoming message just refetches the list, which keeps
 * ordering, previews and unread counts consistent with the server.
 */

import { useCallback, useEffect, useState } from 'react';
import { chatService, getErrorMessage } from '../services/api.js';
import { getSocket } from '../services/socket.js';

const useChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await chatService.list();
      setChats(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('message:receive', load);
    socket.on('connect', load);
    return () => {
      socket.off('message:receive', load);
      socket.off('connect', load);
    };
  }, [load]);

  return { chats, loading, error, reload: load };
};

export default useChats;
