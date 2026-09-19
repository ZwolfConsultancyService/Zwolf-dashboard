import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  UserRound,
  CalendarDays,
  Users,
  FolderKanban,
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

const TARGET_OPTIONS = [
  { value: 'developers', label: 'All Developers' },
  { value: 'sales', label: 'All Sales' },
  { value: 'everyone', label: 'Everyone' },
  { value: 'specific', label: 'Specific Developer(s)' },
];

const targetLabel = (type) =>
  TARGET_OPTIONS.find((t) => t.value === type)?.label || type;

const targetColor = (type) => {
  if (type === 'developers') return 'green';
  if (type === 'sales') return 'blue';
  if (type === 'specific') return 'orange';

  return 'purple';
};

export default function ManagerDetails() {
  const { success, error: toastError } = useToast();

  const [details, setDetails] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState({
    title: '',
    details: '',
    targetType: 'developers',
     project: '',
    specificRecipients: [],
  });

  /* =========================================================
     LOAD DETAILS
  ========================================================== */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/details', {
        params: { limit: 100 },
      });

      setDetails(data.data);
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load details'
      );
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     LOAD EMPLOYEES
  ========================================================== */

 useEffect(() => {
  api
    .get('/employees', {
      params: { limit: 100 },
    })
    .then((res) => setEmployees(res.data.data))
    .catch(() => {});

  api
    .get('/projects', {
      params: { limit: 100 },
    })
    .then((res) => {
      console.log('✅ PROJECTS LOADED:', res.data.data);
      setProjects(res.data.data);
    })
    .catch((err) => {
      console.error('❌ PROJECTS ERROR:', err.response?.data || err.message);
    });
}, []);

  /* =========================================================
     CREATE
  ========================================================== */

  const openCreate = () => {
    setEditing(null);

    setForm({
      title: '',
      details: '',
      project: '',
      targetType: 'developers',
      specificRecipients: [],
    });

    setModalOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================== */

  const openEdit = (d) => {
    setEditing(d);

    setForm({
      title: d.title,
      details: d.details,
        project: d.project?._id || d.project || '',
      targetType: d.targetType,
      
      specificRecipients: (d.specificRecipients || []).map(
        (r) => r._id || r
      ),
    });

    setModalOpen(true);
  };

  /* =========================================================
     RECIPIENT TOGGLE
  ========================================================== */

  const toggleRecipient = (id) => {
    setForm((f) => ({
      ...f,
      specificRecipients: f.specificRecipients.includes(id)
        ? f.specificRecipients.filter((x) => x !== id)
        : [...f.specificRecipients, id],
    }));
  };

  /* =========================================================
     SUBMIT
  ========================================================== */

  const submit = async (e) => {
    e.preventDefault();

    if (
      form.targetType === 'specific' &&
      form.specificRecipients.length === 0
    ) {
      toastError('Please select at least one recipient');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        details: form.details,
         project: form.project || null,
        targetType: form.targetType,
        specificRecipients:
          form.targetType === 'specific'
            ? form.specificRecipients
            : [],
      };

      if (editing) {
        await api.put(`/details/${editing._id}`, payload);
        success('Detail updated successfully');
      } else {
        await api.post('/details', payload);
        success('Detail sent successfully');
      }

      setModalOpen(false);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save detail'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================== */

  const remove = async (d) => {
    if (!confirm(`Delete detail "${d.title}"?`)) return;

    try {
      await api.delete(`/details/${d._id}`);

      success('Detail deleted successfully');

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete detail'
      );
    }
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
              <FileText size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Details
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Send detailed instructions and important information
                to your teams
              </p>
            </div>
          </div>
        </div>

        <Button onClick={openCreate}>
          <Plus size={16} />
          New Detail
        </Button>
      </div>

      {/* =====================================================
          DETAILS LIST
      ====================================================== */}

      <Card>
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader />
            </div>
          ) : details.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No details yet"
                message="Send your first detailed instruction to your team"
                action={
                  <Button onClick={openCreate}>
                    <Plus size={16} />
                    New Detail
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="space-y-4">
              {details.map((d) => {
                const recipientCount =
                  d.specificRecipients?.length || 0;

                return (
                  <div
                    key={d._id}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      {/* =================================================
                          ICON
                      ================================================== */}

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <FileText size={21} />
                      </div>

                      {/* =================================================
                          CONTENT
                      ================================================== */}

                      <div className="min-w-0 flex-1">
                        {/* Title + Badge */}

                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold text-gray-900">
                            {d.title}
                          </h3>

                          <Badge color={targetColor(d.targetType)}>
                            {targetLabel(d.targetType)}
                          </Badge>
                            {d.project && (
    <Badge color="purple">
      <FolderKanban size={12} className="mr-1 inline" />
      {d.project.projectName}
    </Badge>
  )}

                          {!d.isActive && (
                            <Badge color="red">
                              Inactive
                            </Badge>
                          )}
                        </div>

                        {/* Description */}

                        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                          <p className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words pr-2 text-sm leading-7 text-gray-600">
                            {d.details}
                          </p>
                        </div>

                        {/* Specific Recipients */}

                        {d.targetType === 'specific' &&
                          recipientCount > 0 && (
                            <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                  <Users size={15} />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    Specific Recipients
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {recipientCount}{' '}
                                    {recipientCount === 1
                                      ? 'developer'
                                      : 'developers'}{' '}
                                    selected
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {d.specificRecipients.map((r) => (
                                  <Badge
                                    key={r._id || r}
                                    color="gray"
                                  >
                                    {r.name || 'User'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Footer */}

                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <UserRound
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              By{' '}
                              <span className="font-medium text-gray-700">
                                {d.createdBy?.name || 'Manager'}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CalendarDays
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              {formatDateTime(d.createdAt)}
                            </span>
                          </div>

                          {d.targetType === 'specific' &&
                            recipientCount > 0 && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Users
                                  size={14}
                                  className="text-gray-400"
                                />

                                <span>
                                  {recipientCount}{' '}
                                  {recipientCount === 1
                                    ? 'recipient'
                                    : 'recipients'}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* =================================================
                          ACTIONS
                      ================================================== */}

                      <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(d)}
                        >
                          <Edit size={14} />

                          <span className="hidden sm:inline">
                            Edit
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => remove(d)}
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
        title={editing ? 'Edit Detail' : 'Create New Detail'}
        size="xl"
      >
        <form onSubmit={submit}>
          <div className="space-y-5">
            {/* =================================================
                TITLE
            ================================================== */}

            <div>
              <Input
                label="Detail Title *"
                required
                placeholder="e.g. Payment Gateway Integration Steps"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
              />

              <p className="mt-1.5 text-xs text-gray-400">
                Use a short and clear title that explains the purpose
                of this detail.
              </p>
            </div>

            {/* =================================================
    PROJECT (Optional)
================================================== */}

<div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
  <div className="mb-3 flex items-center gap-3">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
      <FolderKanban size={17} />
    </div>

    <div>
      <p className="text-sm font-semibold text-gray-800">
        Related Project
      </p>

      <p className="text-xs text-gray-400">
        Optional — link this detail to a specific project.
      </p>
    </div>
  </div>

  <Select
    value={form.project}
    onChange={(e) =>
      setForm({
        ...form,
        project: e.target.value,
      })
    }
  >
    <option value="">— No project / General —</option>

    {projects.map((p) => (
      <option key={p._id} value={p._id}>
        {p.projectName}
        {p.client?.clientName
          ? ` — ${p.client.clientName}`
          : ''}
      </option>
    ))}
  </Select>
</div>

            {/* =================================================
                DETAILS
            ================================================== */}

            <div className="form-group">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="form-label mb-0">
                  Full Details / Instructions *
                </label>

                <span className="hidden text-xs text-gray-400 sm:block">
                  Detailed information
                </span>
              </div>

              <textarea
                className="form-textarea min-h-[240px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm leading-7 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                rows={12}
                required
                placeholder={
                  'Poori detail likho — steps, notes, code snippets, references...\n\n' +
                  'Example:\n' +
                  '1. Razorpay account banao\n' +
                  '2. Test API keys generate karo\n' +
                  '3. Order create API call karo\n' +
                  '4. Frontend me checkout integration karo\n' +
                  '5. Webhook handle karo'
                }
                value={form.details}
                onChange={(e) =>
                  setForm({
                    ...form,
                    details: e.target.value,
                  })
                }
              />

              <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                <FileText
                  size={14}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Line breaks preserve rahenge. Aap steps,
                  instructions, notes, links aur code snippets
                  easily add kar sakte ho.
                </span>
              </div>
            </div>

            {/* =================================================
                TARGET TEAM
            ================================================== */}

            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users size={17} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Target Team
                  </p>

                  <p className="text-xs text-gray-400">
                    Choose who should receive this detail.
                  </p>
                </div>
              </div>

              <Select
                label="Send To *"
                value={form.targetType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    targetType: e.target.value,
                    specificRecipients: [],
                  })
                }
              >
                {TARGET_OPTIONS.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                  >
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* =================================================
                SPECIFIC RECIPIENTS
            ================================================== */}

            {form.targetType === 'specific' && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-800">
                      Select Recipients *
                    </label>

                    <p className="mt-0.5 text-xs text-gray-400">
                      Select one or more developers.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                    {form.specificRecipients.length} selected
                  </span>
                </div>

                <div className="max-h-[280px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2">
                  {employees.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <Users
                        size={24}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-2 text-sm font-medium text-gray-600">
                        No users available
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        There are no employees available to select.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {employees.map((emp) => {
                        const checked =
                          form.specificRecipients.includes(
                            emp._id
                          );

                        return (
                          <label
                            key={emp._id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 transition ${
                              checked
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-transparent hover:border-gray-200 hover:bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleRecipient(emp._id)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {emp.name}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-400">
                                {emp.role}
                              </p>
                            </div>

                            {checked && (
                              <span className="text-xs font-medium text-blue-600">
                                Selected
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              MODAL FOOTER
          ================================================== */}

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
              {editing ? 'Update Detail' : 'Send Detail'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
