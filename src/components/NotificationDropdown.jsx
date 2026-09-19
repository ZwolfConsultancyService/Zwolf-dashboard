import { useEffect, useState, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../api/axios.js';
import { formatDateTime } from '../utils/format.js';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.data);
      setUnread(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      load();
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 text-[10px] flex items-center justify-center bg-red-500 text-white rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <button onClick={markAll} className="text-xs text-primary-600 hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.readBy?.some((u) => u === n._id);
                return (
                  <div key={n._id} className={`p-3 border-b last:border-0 ${!n.readBy?.length ? 'bg-blue-50/40' : ''}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}