import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Bell,
  Send,
  Users,
  UserRound,
  Megaphone,
  Clock3,
  MessageSquareText,
  Trash2,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function ManagerNotifications() {
  const { success, error: toastError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    title: '',
    message: '',
    recipientType: 'Everyone',
    recipients: [],
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/notifications', {
        params: {
          limit: 50,
        },
      });

      setNotifications(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/employees', {
        params: {
          limit: 200,
        },
      })
      .then((res) => setEmployees(res.data.data))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/notifications', form);

      success('Notification sent');
      setModalOpen(false);

      setForm({
        title: '',
        message: '',
        recipientType: 'Everyone',
        recipients: [],
      });

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to send'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleRecipient = (id) => {
    setForm((f) => ({
      ...f,
      recipients: f.recipients.includes(id)
        ? f.recipients.filter((x) => x !== id)
        : [...f.recipients, id],
    }));
  };

  /* =========================================================
     🆕 DELETE NOTIFICATION
  ========================================================= */

  const removeNotification = async (notification) => {
    if (
      !confirm(
        `Delete notification "${notification.title}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/notifications/${notification._id}`);
      success('Notification deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to delete notification'
      );
    }
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
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Manager Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Send and manage important updates for your team
              </p>
            </div>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="w-full rounded-xl bg-blue-600 shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md sm:w-auto"
          >
            <Plus size={16} />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <MessageSquareText size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Notification History
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Recent notifications sent by managers
                </p>
              </div>
            </div>

            <span className="hidden rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 sm:inline-flex">
              {notifications.length} Notifications
            </span>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                <Bell size={21} />
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-700">
                No notifications yet
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Send your first notification to your team.
              </p>

              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="mt-4 rounded-xl"
              >
                <Send size={14} />
                Send Notification
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                      <Bell size={18} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                              {n.title}
                            </h3>

                            {/* 🆕 DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => removeNotification(n)}
                              className="
                                shrink-0
                                inline-flex
                                items-center
                                justify-center
                                gap-1.5
                                rounded-lg
                                border
                                border-red-200
                                bg-red-50
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-red-600
                                transition-all
                                duration-200
                                hover:border-red-300
                                hover:bg-red-100
                                hover:text-red-700
                                focus:outline-none
                                focus:ring-2
                                focus:ring-red-500/20
                              "
                              title="Delete notification"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <UserRound size={12} />
                              {n.sender?.name || 'Unknown'}
                            </span>

                            <span className="text-gray-300">
                              •
                            </span>

                            <span className="flex items-center gap-1">
                              <Clock3 size={12} />
                              {formatDateTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {n.message}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Users size={13} />
                          <span>
                            Sent to {n.recipientType}
                          </span>
                        </div>

                        <Badge color="blue">
                          {n.recipientType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Send Notification Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Send Notification"
      >
        <form onSubmit={submit} className="space-y-5">
          {/* Title */}
          <Input
            label="Title *"
            required
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
          />

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Message *
            </label>

            <textarea
              className="input-base w-full resize-none rounded-xl focus:ring-2 focus:ring-blue-500/10"
              rows="4"
              required
              value={form.message}
              onChange={(e) =>
                setForm({
                  ...form,
                  message: e.target.value,
                })
              }
              placeholder="Write your notification message..."
            />
          </div>

          {/* Recipients */}
          <Select
            label="Recipients"
            value={form.recipientType}
            onChange={(e) =>
              setForm({
                ...form,
                recipientType: e.target.value,
                recipients: [],
              })
            }
          >
            <option>Everyone</option>
            <option>Sales</option>
            <option>Developers</option>
            <option>Specific</option>
          </Select>

          {/* Specific Employees */}
          {form.recipientType === 'Specific' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Select Employees
                </label>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                  {form.recipients.length} Selected
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2">
                {employees.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <Users
                      size={22}
                      className="mx-auto text-gray-400"
                    />

                    <p className="mt-2 text-sm text-gray-500">
                      No employees found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {employees.map((emp) => (
                      <label
                        key={emp._id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-white p-3 transition-colors hover:border-blue-100 hover:bg-blue-50/50"
                      >
                        <input
                          type="checkbox"
                          checked={form.recipients.includes(
                            emp._id
                          )}
                          onChange={() =>
                            toggleRecipient(emp._id)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <UserRound size={15} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {emp.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {emp.role}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-xl bg-blue-600 px-5 font-semibold hover:bg-blue-700"
            >
              <Send size={15} />
              Send
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}