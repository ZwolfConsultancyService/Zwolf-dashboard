import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  UserRound,
  CalendarDays,
  Users,
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

const TARGETS = [
  { value: 'developer', label: 'Developers' },
  { value: 'sales', label: 'Sales' },
  { value: 'everyone', label: 'Everyone' },
];

export default function ManagerGuides() {
  const { success, error: toastError } = useToast();

  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    targetRole: 'developer',
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/guides', {
        params: { limit: 100 },
      });

      setGuides(data.data);
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load guides'
      );
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);

    setForm({
      title: '',
      description: '',
      targetRole: 'developer',
    });

    setModalOpen(true);
  };

  const openEdit = (g) => {
    setEditing(g);

    setForm({
      title: g.title,
      description: g.description,
      targetRole: g.targetRole,
    });

    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      if (editing) {
        await api.put(`/guides/${editing._id}`, form);
        success('Guide updated successfully');
      } else {
        await api.post('/guides', form);
        success(`Guide sent to ${form.targetRole}`);
      }

      setModalOpen(false);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save guide'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (g) => {
    if (!confirm(`Delete guide "${g.title}"?`)) return;

    try {
      await api.delete(`/guides/${g._id}`);

      success('Guide deleted successfully');

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete guide'
      );
    }
  };

  const badgeColor = (role) => {
    if (role === 'developer') return 'green';
    if (role === 'sales') return 'blue';

    return 'purple';
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Guides
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Send guides, instructions and announcements to your teams
              </p>
            </div>
          </div>
        </div>

        <Button onClick={openCreate}>
          <Plus size={16} />
          New Guide
        </Button>
      </div>

      {/* =====================================================
          GUIDE LIST
      ====================================================== */}
      <Card>
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader />
            </div>
          ) : guides.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No guides yet"
                message="Send your first guide to developers or sales team"
                action={
                  <Button onClick={openCreate}>
                    <Plus size={16} />
                    New Guide
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {guides.map((g) => {
                const targetLabel =
                  TARGETS.find(
                    (t) => t.value === g.targetRole
                  )?.label || g.targetRole;

                return (
                  <div
                    key={g._id}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:p-6"
                  >
                    {/* =================================================
                        TOP SECTION
                    ================================================== */}
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <BookOpen size={21} />
                      </div>

                      {/* Main Content */}
                      <div className="min-w-0 flex-1">
                        {/* Title + Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold text-gray-900">
                            {g.title}
                          </h3>

                          <Badge color={badgeColor(g.targetRole)}>
                            {targetLabel}
                          </Badge>

                          {!g.isActive && (
                            <Badge color="red">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                          <p className="max-h-52 overflow-y-auto whitespace-pre-wrap break-words pr-2 text-sm leading-7 text-gray-600">
                            {g.description}
                          </p>
                        </div>

                        {/* Footer Info */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <UserRound
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              By{' '}
                              <span className="font-medium text-gray-700">
                                {g.createdBy?.name || 'Manager'}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CalendarDays
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              {formatDateTime(g.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Users
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              Sent to{' '}
                              <span className="font-medium text-gray-700">
                                {targetLabel}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* =================================================
                          ACTIONS
                      ================================================== */}
                      <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(g)}
                        >
                          <Edit size={14} />
                          <span className="hidden sm:inline">
                            Edit
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => remove(g)}
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline">
                            Delete
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* =====================================================
          CREATE / EDIT MODAL
      ====================================================== */}
      
<Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title={editing ? 'Edit Guide' : 'Create New Guide'}
  size="lg"
>
  <form onSubmit={submit}>
    {/* Modal Content */}
    <div className="space-y-5">
      {/* Title */}
      <div>
        <Input
          label="Guide Title *"
          required
          placeholder="e.g. API Integration Steps"
          value={form.title}
          onChange={(e) =>
            setForm({
              ...form,
              title: e.target.value,
            })
          }
        />

        <p className="mt-1.5 text-xs text-gray-400">
          A short and clear title for this guide.
        </p>
      </div>

      {/* Description */}
      <div className="form-group">
        <div className="mb-2 flex items-center justify-between">
          <label className="form-label mb-0">
            Description / Instructions *
          </label>

          <span className="text-xs text-gray-400">
            Detailed instructions
          </span>
        </div>

        <textarea
          className="form-textarea min-h-[220px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          rows={9}
          required
          placeholder="Yahan detailed instructions likho jo developers ya sales team ko follow karni hain..."
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

        <p className="mt-1.5 text-xs text-gray-400">
          Aap detailed steps, instructions, links ya important notes
          add kar sakte ho.
        </p>
      </div>

      {/* Target */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Users size={16} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Target Team
            </p>

            <p className="text-xs text-gray-400">
              Choose who should receive this guide.
            </p>
          </div>
        </div>

        <Select
          label="Send To *"
          value={form.targetRole}
          onChange={(e) =>
            setForm({
              ...form,
              targetRole: e.target.value,
            })
          }
        >
          {TARGETS.map((t) => (
            <option
              key={t.value}
              value={t.value}
            >
              {t.label}
            </option>
          ))}
        </Select>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={() => setModalOpen(false)}
      >
        Cancel
      </Button>

      <Button
        type="submit"
        loading={saving}
      >
        {editing ? 'Update Guide' : 'Send Guide'}
      </Button>
    </div>
  </form>
</Modal>

    </div>
  );
}
