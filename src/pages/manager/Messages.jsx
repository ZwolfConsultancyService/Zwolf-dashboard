import { useEffect, useState, useCallback } from 'react';
import {
  Send,
  MessageCircle,
  Users,
  UserRound,
  Clock3,
  MessagesSquare,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function ManagerMessages() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get('/employees', {
        params: {
          limit: 200,
        },
      })
      .then((res) =>
        setEmployees(
          res.data.data.filter((e) => e._id !== user._id)
        )
      )
      .catch(() => {});
  }, [user._id]);

  const loadMessages = useCallback(async () => {
    if (!selected) {
      setMessages([]);
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.get('/messages', {
        params: {
          withUser: selected,
          limit: 100,
        },
      });

      setMessages(data.data.reverse());
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const send = async (e) => {
    e.preventDefault();

    if (!text.trim() || !selected) return;

    setSending(true);

    try {
      await api.post('/messages', {
        recipient: selected,
        message: text,
      });

      setText('');
      success('Message sent');
      loadMessages();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to send'
      );
    } finally {
      setSending(false);
    }
  };

  const selectedEmployee = employees.find(
    (employee) => employee._id === selected
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageCircle size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Manager Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Messages
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Communicate directly with your team members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <Users size={16} className="text-blue-600" />

            <span className="text-sm font-medium text-gray-600">
              {employees.length} Employees
            </span>
          </div>
        </div>
      </div>

      {/* Messaging Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Employee Selection */}
        <Card className="overflow-hidden lg:col-span-1">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Users size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Team Members
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Choose a conversation
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <Select
              label="Chat with"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-xl"
            >
              <option value="">Select employee</option>

              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} ({e.role})
                </option>
              ))}
            </Select>

            {selectedEmployee && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <UserRound size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {selectedEmployee.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {selectedEmployee.role}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selected && (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 text-center">
                <MessageCircle
                  size={20}
                  className="mx-auto text-gray-400"
                />

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Select an employee to start a conversation.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Chat */}
        <Card className="flex h-[600px] flex-col overflow-hidden lg:col-span-3">
          {/* Chat Header */}
          <div className="border-b border-gray-100 bg-white px-5 py-4">
            {selected ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {selectedEmployee?.name || 'Employee'}
                  </p>

                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {selectedEmployee?.role || 'Employee'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <MessagesSquare size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Conversation
                  </p>

                  <p className="mt-0.5 text-xs text-gray-400">
                    Select an employee to begin
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-5">
              <EmptyState
                title="Select a conversation"
                message="Choose an employee from the team members list to start messaging."
              />
            </div>
          ) : loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-gray-50/60 p-4 sm:p-5">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                        <MessageCircle size={21} />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-700">
                        No messages yet
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Start the conversation by sending a message.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const isMine =
                        m.sender?._id === user._id;

                      return (
                        <div
                          key={m._id}
                          className={`flex ${
                            isMine
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                              isMine
                                ? 'rounded-br-md bg-blue-600 text-white'
                                : 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {m.message}
                            </p>

                            <div
                              className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                                isMine
                                  ? 'text-blue-100'
                                  : 'text-gray-400'
                              }`}
                            >
                              <Clock3 size={10} />
                              {formatDateTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={send}
                className="border-t border-gray-100 bg-white p-4"
              >
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5 transition-colors focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10">
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-0"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  <Button
                    type="submit"
                    loading={sending}
                    disabled={!text.trim()}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 transition-all hover:bg-blue-700"
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline">
                      Send
                    </span>
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}