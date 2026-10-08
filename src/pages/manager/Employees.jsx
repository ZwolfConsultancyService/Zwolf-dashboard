import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Power,
  Trash2,
  ScanFace,
} from 'lucide-react';
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
import FaceEnrollModal from '../../components/FaceEnrollModal.jsx';

export default function ManagerEmployees() {
  const { success, error: toastError } = useToast();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'sales',
    department: '', designation: '',
  });
  const [saving, setSaving] = useState(false);

  /* 🆕 FACE ENROLL MODAL STATE */
  const [faceModal, setFaceModal] = useState({
    open: false,
    employee: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (role) params.role = role;
      const { data } = await api.get('/employees', { params });
      setEmployees(data.data);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', role: 'sales', department: '', designation: '' });
    setModalOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, password: '', phone: emp.phone || '', role: emp.role, department: emp.department || '', designation: emp.designation || '' });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/employees/${editing._id}`, payload);
        success('Employee updated');
      } else {
        await api.post('/employees', form);
        success('Employee created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggleStatus = async (emp) => {
    try {
      await api.patch(`/employees/${emp._id}/status`);
      success(`Employee ${emp.isActive ? 'disabled' : 'enabled'}`);
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    }
  };

  const deleteEmployee = async (emp) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${emp.name}?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/employees/${emp._id}`);
      success('Employee deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete employee'
      );
    }
  };

  /* 🆕 OPEN FACE MODAL */
  const openFaceModal = (emp) => {
    setFaceModal({ open: true, employee: emp });
  };

  const closeFaceModal = () => {
    setFaceModal({ open: false, employee: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] active:translate-y-0"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Employee
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input-base pl-9"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="manager">Manager</option>
            <option value="sales">Sales</option>
            <option value="developer">Developer</option>
          </Select>
        </div>

        <Table
          loading={loading}
          data={employees}
          columns={[
            { header: 'Name', render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-xs text-gray-500">{r.email}</p></div> },
            { header: 'Role', render: (r) => <Badge color={statusColor(r.role)}>{r.role}</Badge> },
            { header: 'Department', key: 'department' },
            { header: 'Status', render: (r) => <Badge color={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Disabled'}</Badge> },

            /* 🆕 FACE COLUMN */
            {
              header: 'Face ID',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => openFaceModal(r)}
                  title={r.faceRegistered ? 'Re-register face' : 'Register face'}
                  className={`
                    inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95
                    ${
                      r.faceRegistered
                        ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100'
                        : 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100'
                    }
                  `}
                >
                  <ScanFace size={13} />
                  {r.faceRegistered ? 'Registered' : 'Register'}
                </button>
              ),
            },

            {
              header: 'Actions',
              className: 'text-right',
              render: (r) => (
                <div className="flex items-center justify-end gap-2">

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    title="Edit employee"
                    className="group flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                  >
                    <Pencil size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                  </button>

                  {/* Enable / Disable */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(r)}
                    title={r.isActive ? 'Disable employee' : 'Enable employee'}
                    className={`
                      group flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95
                      ${
                        r.isActive
                          ? 'border-orange-200 bg-orange-50 text-orange-500 hover:border-orange-300 hover:bg-orange-100 hover:text-orange-600'
                          : 'border-green-200 bg-green-50 text-green-600 hover:border-green-300 hover:bg-green-100 hover:text-green-700'
                      }
                    `}
                  >
                    <Power size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => deleteEmployee(r)}
                    title="Delete employee"
                    className="group flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-600 active:scale-95"
                  >
                    <Trash2 size={16} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                  </button>

                </div>
              ),
            },
          ]}
        />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Employee' : 'Add Employee'}
      >
        <form onSubmit={submit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                <p className="mt-1 text-xs text-gray-500">Enter the employee's personal and contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />

              <div className="relative">
                <Input
                  label={editing ? 'Password (leave blank to keep)' : 'Password'}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-[34px] flex items-center justify-center text-gray-400 transition hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          {/* Work Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M16 21V3" />
                  <path d="M8 21V3" />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">Work Information</h3>
                <p className="mt-1 text-xs text-gray-500">Configure the employee's role and professional details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="manager">Manager</option>
                <option value="sales">Sales</option>
                <option value="developer">Developer</option>
              </Select>

              <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />

              <div className="sm:col-span-2">
                <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-5">
            <p className="hidden text-xs text-gray-500 sm:block">
              {editing ? 'Update the employee information and save changes.' : 'Complete the employee details before saving.'}
            </p>

            <div className="ml-auto flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                {editing ? 'Update Employee' : 'Save Employee'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 🆕 FACE ENROLL MODAL */}
      {faceModal.open && faceModal.employee && (
        <FaceEnrollModal
          employee={faceModal.employee}
          onClose={closeFaceModal}
          onSuccess={() => load()}
        />
      )}
    </div>
  );
}