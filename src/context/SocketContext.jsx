import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import {
  registerServiceWorker,
  subscribeToPush,
} from '../utils/pushSubscription.js';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [newMessageEvent, setNewMessageEvent] = useState(null);
  const [seenEvent, setSeenEvent] = useState(null);
  const [clearedEvent, setClearedEvent] = useState(null);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    /* =========================================
       REGISTER SERVICE WORKER + PUSH
    ========================================= */

    (async () => {
      await registerServiceWorker();
      await subscribeToPush(
        user.role === 'client' ? 'client' : 'employee'
      );
    })();

    /* =========================================
       SOCKET CONNECT
    ========================================= */

    const API_URL =
      import.meta.env.VITE_API_URL?.replace('/api', '') || '';

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    newSocket.on('new-message', (data) => {
      console.log('🔔 New message event:', data);
      setNewMessageEvent({ ...data, _ts: Date.now() });
    });

    newSocket.on('messages-seen', (data) => {
      setSeenEvent({ ...data, _ts: Date.now() });
    });

    newSocket.on('chat-cleared', (data) => {
      setClearedEvent({ ...data, _ts: Date.now() });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        newMessageEvent,
        seenEvent,
        clearedEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);