import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, EyeOff } from 'lucide-react';
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
import { formatCurrency, formatDate } from '../../utils/format.js';

const STATUSES = [
  'New Lead', 'Contacted', 'Discussion', 'Proposal Sent',
  'Negotiation', 'Confirmed', 'Project Started', 'Completed', 'Lost',
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

export default function SalesClients() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Client add/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName: '', companyName: '', email: '', phone: '', alternatePhone: '',
    address: '', city: '', state: '', serviceRequired: '', description: '',
    clientStatus: 'New Lead', followUpDate: '', totalAmount: 0,
    password: '',   // 🆕
  });

  // Payment modal
  const [payModal, setPayModal] = useState(false);
  const [payClient, setPayClient] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '', paymentMethod: 'UPI', transactionId: '', notes: '', paymentDate: '',
  });

  // Status update modal
  const [statusModal, setStatusModal] = useState(false);
  const [statusClient, setStatusClient] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Requirement / Note modal
  const [noteModal, setNoteModal] = useState(false);
  const [noteClient, setNoteClient] = useState(null);
  const [noteText, setNoteText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      const { data } = await api.get('/clients', { params });
      setClients(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toastError]);

  useEffect(() => { load(); }, [load]);

  // -------- Client Create/Edit --------
  const openCreate = () => {
    setEditing(null);
    setForm({
      clientName: '', companyName: '', email: '', phone: '', alternatePhone: '',
      address: '', city: '', state: '', serviceRequired: '', description: '',
      clientStatus: 'New Lead', followUpDate: '', totalAmount: 0,
      password: '',   // 🆕
    });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      clientName: c.clientName, companyName: c.companyName || '',
      email: c.email || '', phone: c.phone, alternatePhone: c.alternatePhone || '',
      address: c.address || '', city: c.city || '', state: c.state || '',
      serviceRequired: c.serviceRequired || '', description: c.description || '',
      clientStatus: c.clientStatus,
      followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
      totalAmount: c.totalAmount || 0,
      password: '',   // 🆕
    });
    setModalOpen(true);
  };

  const submitClient = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };

      /* 🆕 Edit ke time password blank ho to skip */
      if (editing && (!payload.password || !payload.password.trim())) {
        delete payload.password;
      }

      if (editing) {
        await api.put(`/clients/${editing._id}`, payload);
        success('Client updated');
      } else {
        await api.post('/clients', payload);
        success('Client created');
      }

      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // -------- Update Status --------
  const openStatusModal = (c) => {
    setStatusClient(c);
    setNewStatus(c.clientStatus);
    setStatusNote('');
    setStatusModal(true);
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/clients/${statusClient._id}`, { clientStatus: newStatus });
      if (statusNote.trim()) {
        await api.post(`/clients/${statusClient._id}/notes`, {
          text: `Status changed to "${newStatus}": ${statusNote}`,
        });
      }
      success('Status updated');
      setStatusModal(false);
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  // -------- Add Payment --------
  const openPayModal = (c) => {
    setPayClient(c);
    setPayForm({
      amount: '', paymentMethod: 'UPI', transactionId: '', notes: '',
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    setPayModal(true);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payments', {
        ...payForm,
        amount: Number(payForm.amount),
        client: payClient._id,
      });
      success('Payment added');
      setPayModal(false);
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  // -------- Add Note / Requirement --------
  const openNoteModal = (c) => {
    setNoteClient(c);
    setNoteText('');
    setNoteModal(true);
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/clients/${noteClient._id}/notes`, { text: noteText });
      success('Note added');
      setNoteModal(false);
      setNoteText('');
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            My Clients
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage clients, payments, follow-ups and requirements.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-[0_4px_12px_rgba(37,99,235,0.22)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-blue-700
            hover:shadow-[0_6px_18px_rgba(37,99,235,0.28)]
            active:translate-y-0
            focus:outline-none
            focus:ring-4
            focus:ring-blue-500/20
          "
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Client
        </Button>
      </div>

      <Card>
        {/* Search & Filter */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px]">

            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  py-2.5
                  pl-10
                  pr-4
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
                "
                placeholder="Search by name, company or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status */}
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-[1100px] w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Client
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Phone
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Paid
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Unpaid
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Follow-up
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">

              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
                      <span className="text-sm text-gray-500">
                        Loading clients...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
                        <Search size={20} className="text-gray-400" />
                      </div>

                      <p className="text-sm font-medium text-gray-900">
                        No clients found
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Try changing your search or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr
                    key={c._id}
                    className="transition-colors duration-150 hover:bg-blue-50/30"
                  >

                    {/* Client */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/sales/clients/${c._id}`)}
                        className="text-left"
                      >
                        <div className="font-semibold text-blue-600 transition-colors hover:text-blue-700">
                          {c.clientName}
                        </div>

                        <div className="mt-0.5 max-w-[180px] truncate text-xs text-gray-500">
                          {c.companyName || 'No company'}
                        </div>
                      </button>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {c.phone}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <Badge color={statusColor(c.clientStatus)}>
                        {c.clientStatus}
                      </Badge>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-4 text-sm font-medium text-gray-800">
                      {formatCurrency(c.totalAmount)}
                    </td>

                    {/* Paid */}
                    <td className="px-4 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(c.totalPaid)}
                    </td>

                    {/* Unpaid */}
                    <td className="px-4 py-4">
                      <span
                        className={
                          c.remainingAmount > 0
                            ? 'text-sm font-semibold text-red-600'
                            : 'text-sm font-medium text-gray-500'
                        }
                      >
                        {formatCurrency(c.remainingAmount)}
                      </span>
                    </td>

                    {/* Follow-up */}
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {formatDate(c.followUpDate)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStatusModal(c)}
                          className="rounded-lg"
                        >
                          Status
                        </Button>

                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => openPayModal(c)}
                          disabled={c.remainingAmount <= 0}
                          className="rounded-lg"
                        >
                          + Payment
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openNoteModal(c)}
                          className="rounded-lg"
                        >
                          + Note
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                          className="rounded-lg"
                        >
                          Edit
                        </Button>

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* ---------- Client Create/Edit Modal ---------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Client' : 'Add Client'}
        size="lg"
      >
        <form onSubmit={submitClient} className="space-y-6">

          {/* Client Information */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Client Information
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Enter the basic details and contact information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Client Name"
                required
                value={form.clientName}
                onChange={(e) =>
                  setForm({ ...form, clientName: e.target.value })
                }
              />

              <Input
                label="Company Name"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <Input
                label="Phone"
                required
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value })
                }
              />

              <Input
                label="Alternate Phone"
                value={form.alternatePhone}
                onChange={(e) =>
                  setForm({ ...form, alternatePhone: e.target.value })
                }
              />

              <Input
                label="City"
                value={form.city}
                onChange={(e) =>
                  setForm({ ...form, city: e.target.value })
                }
              />

              <Input
                label="State"
                value={form.state}
                onChange={(e) =>
                  setForm({ ...form, state: e.target.value })
                }
              />

              <Input
                label="Service Required"
                value={form.serviceRequired}
                onChange={(e) =>
                  setForm({ ...form, serviceRequired: e.target.value })
                }
              />
            </div>
          </div>

          {/* 🆕 Client Portal Access */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Client Portal Access
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Client will use these credentials to login to their dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Client ID (readonly) */}
              <Input
                label="Client ID"
                value={
                  editing
                    ? editing.portalId || ''
                    : 'Generated automatically'
                }
                disabled
                readOnly
                className="bg-gray-100"
              />

              {/* Password */}
              {/* Password with eye toggle */}
<div>
  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
    {editing ? 'New Password' : 'Client Portal Password'}
    {!editing && <span className="ml-1 text-red-500">*</span>}
  </label>

  <div className="relative">
    <input
      type={showPassword ? 'text' : 'password'}
      value={form.password}
      onChange={(e) =>
        setForm({ ...form, password: e.target.value })
      }
      placeholder={
        editing
          ? 'Leave blank to keep current password'
          : 'Enter client login password'
      }
      required={!editing}
      className="
        w-full
        rounded-lg
        border
        border-gray-300
        bg-white
        px-3.5
        py-2.5
        pr-11
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
      "
    />

    {/* Eye toggle */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-gray-400
        transition-colors
        hover:text-gray-600
        focus:outline-none
      "
      tabIndex={-1}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>
</div>
            </div>

            <div className="mt-3 rounded-lg border border-blue-100 bg-white px-3 py-2.5">
              <p className="text-xs text-blue-700">
                {editing
                  ? 'Leave the password blank to keep the current client portal password.'
                  : 'The Client ID will be generated automatically after creating the client.'}
              </p>
            </div>
          </div>

          {/* Sales & Payment */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Sales & Payment
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Manage client status, follow-up and payment details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Status"
                value={form.clientStatus}
                onChange={(e) =>
                  setForm({ ...form, clientStatus: e.target.value })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>

              <Input
                label="Follow-up Date"
                type="date"
                value={form.followUpDate}
                onChange={(e) =>
                  setForm({ ...form, followUpDate: e.target.value })
                }
              />

              <Input
                label="Total Amount (₹)"
                type="number"
                value={form.totalAmount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    totalAmount: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Address
              </h3>
            </div>

            <textarea
              rows={3}
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
              placeholder="Enter complete client address..."
              className="
                w-full resize-none rounded-lg border border-gray-300
                bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none
                transition-all duration-200 placeholder:text-gray-400
                hover:border-gray-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          {/* Description */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Description / Requirements
              </h3>
            </div>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Enter client requirements, notes or additional information..."
              className="
                w-full resize-none rounded-lg border border-gray-300
                bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none
                transition-all duration-200 placeholder:text-gray-400
                hover:border-gray-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
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
              className="
                rounded-xl bg-blue-600 px-6 font-semibold text-white
                shadow-[0_4px_12px_rgba(37,99,235,0.22)]
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-[0_6px_16px_rgba(37,99,235,0.28)]
              "
            >
              {editing ? 'Update Client' : 'Create Client'}
            </Button>
          </div>

        </form>
      </Modal>

      {/* ---------- Payment Modal ---------- */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title="Add Payment"
      >
        {payClient && (
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="text-sm font-semibold text-gray-900">
              {payClient.clientName}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(payClient.totalAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Paid</p>
                <p className="mt-1 text-sm font-semibold text-green-600">
                  {formatCurrency(payClient.totalPaid)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Unpaid</p>
                <p className="mt-1 text-sm font-semibold text-red-600">
                  {formatCurrency(payClient.remainingAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={submitPayment} className="space-y-4">

          <Input
            label="Amount (₹)"
            type="number"
            required
            value={payForm.amount}
            onChange={(e) =>
              setPayForm({ ...payForm, amount: e.target.value })
            }
            hint={
              payClient
                ? `Maximum payable: ${formatCurrency(payClient.remainingAmount)}`
                : ''
            }
          />

          <Select
            label="Payment Method"
            value={payForm.paymentMethod}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                paymentMethod: e.target.value,
              })
            }
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>

          <Input
            label="Transaction ID"
            value={payForm.transactionId}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                transactionId: e.target.value,
              })
            }
            placeholder="Enter transaction/reference ID"
          />

          <Input
            label="Payment Date"
            type="date"
            value={payForm.paymentDate}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                paymentDate: e.target.value,
              })
            }
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>

            <textarea
              rows={3}
              value={payForm.notes}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  notes: e.target.value,
                })
              }
              placeholder="Add payment notes..."
              className="
                w-full resize-none rounded-lg border border-gray-300
                bg-white px-3.5 py-2.5 text-sm outline-none
                transition-all duration-200 placeholder:text-gray-400
                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
              "
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              variant="success"
            >
              Save Payment
            </Button>
          </div>

        </form>
      </Modal>

      {/* ---------- Status Update Modal ---------- */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Client Status"
      >
        {statusClient && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              {statusClient.clientName}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Current Status:
              </span>

              <Badge color={statusColor(statusClient.clientStatus)}>
                {statusClient.clientStatus}
              </Badge>
            </div>
          </div>
        )}

        <form onSubmit={submitStatus} className="space-y-4">

          <Select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Note <span className="font-normal text-gray-400">(Optional)</span>
            </label>

            <textarea
              rows={4}
              placeholder="Add a note about this status change..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="
                w-full resize-none rounded-lg border border-gray-300
                bg-white px-3.5 py-2.5 text-sm outline-none
                transition-all duration-200 placeholder:text-gray-400
                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
              "
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)] active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Update Status
            </Button>
          </div>

        </form>
      </Modal>

      {/* ---------- Add Note / Requirement Modal ---------- */}
      <Modal
        open={noteModal}
        onClose={() => setNoteModal(false)}
        title="Add Note / Requirement"
      >
        {noteClient && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              {noteClient.clientName}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Add additional information, requirements or client updates.
            </p>
          </div>
        )}

        <form onSubmit={submitNote} className="space-y-4">

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Note / Requirement
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              rows={6}
              placeholder="Enter client requirement, discussion notes or any important update..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              required
              className="
                w-full resize-none rounded-lg border border-gray-300
                bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none
                transition-all duration-200 placeholder:text-gray-400
                hover:border-gray-400
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Add Note
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}