import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatDate } from '../../utils/format.js';

const STATUSES = ['Not Started', 'Planning', 'In Progress', 'On Hold', 'Testing', 'Completed', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function Projects() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectName: '', client: '', salesEmployee: '', developers: [],
    description: '', technology: '', startDate: '', deadline: '',
    priority: 'Medium', status: 'Not Started', progress: 0, requirements: '',
    totalAmount: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      const { data } = await api.get('/projects', { params });
      setProjects(data.data);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      api.get('/clients', { params: { limit: 200 } }),
      api.get('/employees', { params: { role: 'developer', limit: 100 } }),
      api.get('/employees', { params: { role: 'sales', limit: 100 } }),
    ]).then(([c, d, s]) => {
      setClients(c.data.data);
      setDevelopers(d.data.data);
      setSalesUsers(s.data.data);
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalAmount: Number(form.totalAmount) || 0,
      };

      await api.post('/projects', payload);
      success('Project created');
      setModalOpen(false);

      setForm({
        projectName: '', client: '', salesEmployee: '', developers: [],
        description: '', technology: '', startDate: '', deadline: '',
        priority: 'Medium', status: 'Not Started', progress: 0, requirements: '',
        totalAmount: '',
      });

      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const toggleDev = (id) => {
    setForm((f) => ({
      ...f,
      developers: f.developers.includes(id)
        ? f.developers.filter((x) => x !== id)
        : [...f.developers, id],
    }));
  };

  /* =========================================================
     🆕 DELETE PROJECT
  ========================================================= */

  const removeProject = async (project) => {
    if (
      !confirm(
        `Delete project "${project.projectName}"?\n\nThis will also delete all tasks of this project. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/projects/${project._id}`);
      success('Project deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete project'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button
          onClick={() => setModalOpen(true)}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-[0_4px_12px_rgba(37,99,235,0.25)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-blue-700
            hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]
            active:translate-y-0
            focus:outline-none
            focus:ring-4
            focus:ring-blue-500/20
          "
        >
          <Plus size={18} strokeWidth={2.5} />
          New Project
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input className="input-base pl-9" placeholder="Search projects"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>

        <Table
          loading={loading}
          data={projects}
          columns={[
            {
              header: 'Project',
              render: (r) => (
                <button onClick={() => navigate(`/manager/projects/${r._id}`)} className="text-left">
                  <p className="font-medium text-primary-600 hover:underline">{r.projectName}</p>
                  <p className="text-xs text-gray-500">{r.client?.clientName || '—'}</p>
                </button>
              ),
            },
            { header: 'Status', render: (r) => <Badge color={statusColor(r.status)}>{r.status}</Badge> },
            { header: 'Priority', render: (r) => <Badge color={statusColor(r.priority)}>{r.priority}</Badge> },
            {
              header: 'Progress',
              render: (r) => (
                <div className="w-32">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500" style={{ width: `${r.progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{r.progress}%</p>
                </div>
              ),
            },
            {
              header: 'Developers',
              render: (r) => r.developers?.map((d) => d.name).join(', ') || '—',
            },
            { header: 'Deadline', render: (r) => formatDate(r.deadline) },

            /* 🆕 DELETE ACTION */
            {
              header: 'Actions',
              className: 'text-right',
              render: (r) => (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeProject(r)}
                    className="
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
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Project"
        size="lg"
      >
        <form onSubmit={submit} className="space-y-6">

          {/* Project Information */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Project Information
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Add the basic details and client information for this project.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Input
                label="Project Name"
                required
                value={form.projectName}
                onChange={(e) =>
                  setForm({ ...form, projectName: e.target.value })
                }
              />

              <Select
                label="Client"
                required
                value={form.client}
                onChange={(e) =>
                  setForm({ ...form, client: e.target.value })
                }
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName}
                  </option>
                ))}
              </Select>

              <Select
                label="Sales Employee"
                value={form.salesEmployee}
                onChange={(e) =>
                  setForm({ ...form, salesEmployee: e.target.value })
                }
              >
                <option value="">Auto (client's sales)</option>
                {salesUsers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Technology"
                value={form.technology}
                onChange={(e) =>
                  setForm({ ...form, technology: e.target.value })
                }
                placeholder="e.g. React, Node.js, MongoDB"
              />

              <div className="md:col-span-2">
                <Input
                  label="Project Total Amount (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm({ ...form, totalAmount: e.target.value })
                  }
                  placeholder="e.g. 50000"
                />

                <p className="mt-1 text-xs text-gray-500">
                  💡 Client is project ka total price dekhega payments page pe
                </p>
              </div>
            </div>
          </div>


          {/* Timeline & Status */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Timeline & Status
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Set project dates, priority and current status.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />

              <Input
                label="Deadline"
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
              />

              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value })
                }
              >
                {PRIORITIES.map((p) => (
                  <option key={p}>
                    {p}
                  </option>
                ))}
              </Select>

              <Select
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>


          {/* Developers */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Assign Developers
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Select the developers who will work on this project.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {developers.map((d) => {
                const selected = form.developers.includes(d._id);

                return (
                  <label
                    key={d._id}
                    className={`
                      flex
                      cursor-pointer
                      items-center
                      gap-3
                      rounded-lg
                      border
                      px-3
                      py-2.5
                      transition-all
                      duration-200
                      ${
                        selected
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleDev(d._id)}
                      className="
                        h-4
                        w-4
                        rounded
                        border-gray-300
                        text-blue-600
                        accent-blue-600
                        focus:ring-2
                        focus:ring-blue-500/20
                      "
                    />

                    <span
                      className={`text-sm ${
                        selected
                          ? 'font-medium text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {d.name}
                    </span>
                  </label>
                );
              })}
            </div>

            {developers.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-center">
                <p className="text-sm text-gray-500">
                  No developers available.
                </p>
              </div>
            )}
          </div>


          {/* Requirements */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Project Requirements
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Describe the requirements and expected functionality.
              </p>
            </div>

            <textarea
              rows="4"
              value={form.requirements}
              onChange={(e) =>
                setForm({ ...form, requirements: e.target.value })
              }
              placeholder="Enter project requirements..."
              className="
                w-full
                resize-none
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3.5
                py-2.5
                text-sm
                text-gray-900
                outline-none
                transition-all
                duration-200
                placeholder:text-gray-400
                hover:border-gray-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
                focus:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]
              "
            />
          </div>


          {/* Description */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Project Description
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Add additional notes or information about the project.
              </p>
            </div>

            <textarea
              rows="4"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Enter project description..."
              className="
                w-full
                resize-none
                rounded-lg
                border
                border-gray-300
                bg-white
                px-3.5
                py-2.5
                text-sm
                text-gray-900
                outline-none
                transition-all
                duration-200
                placeholder:text-gray-400
                hover:border-gray-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
                focus:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]
              "
            />
          </div>


          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-5">

            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="
                rounded-xl
                px-5
                py-2.5
                text-sm
                font-medium
                transition-all
                duration-200
                hover:bg-gray-50
              "
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="
                rounded-xl
                bg-blue-600
                px-6
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-[0_4px_12px_rgba(37,99,235,0.22)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-[0_6px_16px_rgba(37,99,235,0.28)]
                active:translate-y-0
                focus:outline-none
                focus:ring-4
                focus:ring-blue-500/20
              "
            >
              Create Project
            </Button>

          </div>

        </form>
      </Modal>
    </div>
  );
}