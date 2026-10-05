import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';

import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/* =========================================================
   SOUND (Web Audio API — no file needed)
========================================================= */

let audioCtx = null;

const playSound = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.4
    );

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.warn('Sound failed:', err);
  }
};

/* =========================================================
   BROWSER NOTIFICATION
========================================================= */

const showBrowserNotification = (title, body, onClick) => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const n = new Notification(title, {
    body,
    icon: '/icon-192.png',
  });

  if (onClick) {
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  }
};

/* =========================================================
   COMPONENT
========================================================= */

export default function MessageNotifier() {
  const { user } = useAuth();
  const { newMessageEvent } = useSocket();
  const [popups, setPopups] = useState([]);
  const navigate = useNavigate();
  const lastIdRef = useRef(null);
  const timersRef = useRef({});

  useEffect(() => {
    if (!newMessageEvent || !user) return;

    const eventId = newMessageEvent.message?._id;
    if (!eventId || lastIdRef.current === eventId) return;
    lastIdRef.current = eventId;

    /* Skip if already inside that chat */
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const isInChat =
      currentPath.includes('/messages') &&
      currentSearch.includes(newMessageEvent.conversationId);

    if (isInChat) return;

    /* Play sound + browser notification */
    playSound();

    const senderName = newMessageEvent.senderName || 'New message';
    const text =
      newMessageEvent.message?.text ||
      newMessageEvent.message?.messageType ||
      'Sent you a message';

    const basePath =
      user.role === 'client' ? '/client' : `/${user.role}`;
    const openUrl = `${basePath}/messages?c=${newMessageEvent.conversationId}`;

    showBrowserNotification(senderName, text, () => navigate(openUrl));

    /* Add in-app popup */
    const popup = {
      id: eventId,
      conversationId: newMessageEvent.conversationId,
      senderName,
      text,
      createdAt: Date.now(),
      seen: false,
    };

    setPopups((prev) => [popup, ...prev].slice(0, 3));

    /* Auto remove after 6s */
    timersRef.current[eventId] = setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== eventId));
    }, 6000);

    /* Reminder after 1 minute if not seen */
    setTimeout(() => {
      setPopups((prev) => {
        const stillOpen = prev.find((p) => p.id === eventId);
        if (stillOpen && !stillOpen.seen) {
          playSound();
          showBrowserNotification(`⏰ Reminder: ${senderName}`, text, () =>
            navigate(openUrl)
          );
        }
        return prev;
      });
    }, 60000);
  }, [newMessageEvent, user, navigate]);

  /* Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  if (!user || popups.length === 0) return null;

  const openChat = (popup) => {
    setPopups((prev) =>
      prev.map((p) => (p.id === popup.id ? { ...p, seen: true } : p))
    );

    const basePath =
      user.role === 'client' ? '/client' : `/${user.role}`;
    navigate(`${basePath}/messages?c=${popup.conversationId}`);

    setPopups((prev) => prev.filter((p) => p.id !== popup.id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-80">
      {popups.map((popup) => (
        <div
          key={popup.id}
          onClick={() => openChat(popup)}
          className="bg-white border-l-4 border-blue-600 shadow-lg rounded-lg p-3 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <MessageSquare size={16} className="text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {popup.senderName}
              </p>
              <p className="text-xs text-gray-600 truncate mt-0.5">
                {popup.text}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setPopups((prev) =>
                  prev.filter((p) => p.id !== popup.id)
                );
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}