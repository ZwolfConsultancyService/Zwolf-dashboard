import { useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock3,
  MessageSquareText,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function SalesNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/notifications', {
        params: {
          limit: 20,   // 🆕 Latest 20 only
        },
      });

      setNotifications(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bell size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Stay updated with important company and sales activities
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={markAll}
          >
            <CheckCheck size={16} />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MessageSquareText size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Notification Center
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Your latest notifications and updates
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : notifications.length === 0 ? (
            <EmptyState title="No notifications" />
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => {
                const isRead = n.readBy?.some(
                  (r) => (r._id || r) === user._id
                );

                return (
                  <div
                    key={n._id}
                    className={`group flex gap-3 rounded-xl border p-4 transition ${
                      !isRead
                        ? 'border-blue-100 bg-blue-50/50'
                        : 'border-gray-100 bg-white hover:bg-gray-50/60'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        !isRead
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Bell size={18} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm ${
                                !isRead
                                  ? 'font-semibold text-gray-900'
                                  : 'font-medium text-gray-800'
                              }`}
                            >
                              {n.title}
                            </p>

                            {!isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                            )}
                          </div>

                          <p className="mt-1 text-sm leading-5 text-gray-600">
                            {n.message}
                          </p>
                        </div>

                        {!isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markRead(n._id)}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock3 size={13} />
                        <span>{formatDateTime(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}