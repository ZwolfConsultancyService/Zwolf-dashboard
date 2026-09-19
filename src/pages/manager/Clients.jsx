import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
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

export default function Clients() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignedSales, setAssignedSales] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clientName: '', companyName: '', email: '', phone: '', alternatePhone: '',
    address: '', city: '', state: '', serviceRequired: '', description: '',
    clientStatus: 'New Lead', followUpDate: '', totalAmount: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (assignedSales && user.role === 'manager') params.assignedSales = assignedSales;
      const { data } = await api.get('/clients', { params });
      setClients(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, assignedSales, user.role, toastError]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user.role === 'manager') {
      api.get('/employees', { params: { role: 'sales', limit: 100 } })
        .then((res) => setSalesUsers(res.data.data))
        .catch(() => {});
    }
  }, [user.role]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      clientName: '', companyName: '', email: '', phone: '', alternatePhone: '',
      address: '', city: '', state: '', serviceRequired: '', description: '',
      clientStatus: 'New Lead', followUpDate: '', totalAmount: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      clientName: c.clientName || '', companyName: c.companyName || '',
      email: c.email || '', phone: c.phone || '', alternatePhone: c.alternatePhone || '',
      address: c.address || '', city: c.city || '', state: c.state || '',
      serviceRequired: c.serviceRequired || '', description: c.description || '',
      clientStatus: c.clientStatus || 'New Lead',
      followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
      totalAmount: c.totalAmount || 0,
      assignedSales: c.assignedSales?._id || c.assignedSales,
    });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/clients/${editing._id}`, form);
        success('Client updated');
      } else {
        await api.post('/clients', form);
        success('Client created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete client "${c.clientName}"?`)) return;
    try {
      await api.delete(`/clients/${c._id}`);
      success('Client deleted');
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clients</h1>
   <Button
  onClick={openCreate}
  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)] active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
>
  <Plus size={18} strokeWidth={2.5} />
  Add Client
</Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input-base pl-9"
              placeholder="Search name/company/phone"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          {user.role === 'manager' && (
            <Select value={assignedSales} onChange={(e) => { setAssignedSales(e.target.value); setPage(1); }}>
              <option value="">All Sales</option>
              {salesUsers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          )}
        </div>

        <Table
          loading={loading}
          data={clients}
          columns={[
            {
              header: 'Client',
              render: (r) => (
                <button
                  onClick={() => navigate(`/${user.role}/clients/${r._id}`)}
                  className="text-left"
                >
                  <p className="font-medium text-primary-600 hover:underline">{r.clientName}</p>
                  <p className="text-xs text-gray-500">{r.companyName || '—'}</p>
                </button>
              ),
            },
            { header: 'Phone', key: 'phone' },
            {
              header: 'Status',
              render: (r) => <Badge color={statusColor(r.clientStatus)}>{r.clientStatus}</Badge>,
            },
            {
              header: 'Sales',
              render: (r) => r.assignedSales?.name || '—',
            },
            {
              header: 'Total',
              render: (r) => formatCurrency(r.totalAmount),
            },
            {
              header: 'Paid',
              render: (r) => <span className="text-green-600 font-medium">{formatCurrency(r.totalPaid)}</span>,
            },
            {
              header: 'Remaining',
              render: (r) => (
                <span className={r.remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  {formatCurrency(r.remainingAmount)}
                </span>
              ),
            },
            {
              header: 'Follow-up',
              render: (r) => formatDate(r.followUpDate),
            },
            {
              header: 'Actions',
              className: 'text-right',
              render: (r) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(r)}>Delete</Button>
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
  title={editing ? 'Edit Client' : 'Add Client'}
  size="lg"
>
  <form onSubmit={submit} className="space-y-6">

    {/* Client Information */}
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Client Information
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Enter the basic details of the client.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Client Name"
          value={form.clientName}
          onChange={(e) =>
            setForm({ ...form, clientName: e.target.value })
          }
          required
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
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          required
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


    {/* Sales & Payment Information */}
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Sales & Payment
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Manage client status, follow-up and payment information.
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
            <option key={s} value={s}>
              {s}
            </option>
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

        {user.role === 'manager' && (
          <Select
            label="Assigned Sales"
            value={form.assignedSales || ''}
            onChange={(e) =>
              setForm({
                ...form,
                assignedSales: e.target.value,
              })
            }
            required
          >
            <option value="">Select sales</option>

            {salesUsers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>


    {/* Address */}
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Address
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Add the client's complete address.
        </p>
      </div>

      <textarea
        rows="3"
        value={form.address}
        onChange={(e) =>
          setForm({ ...form, address: e.target.value })
        }
        placeholder="Enter client address..."
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
          Additional Information
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Add any additional notes or description about the client.
        </p>
      </div>

      <textarea
        rows="3"
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
        placeholder="Enter client description..."
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
        {editing ? 'Update Client' : 'Create Client'}
      </Button>
    </div>

  </form>
</Modal>
    </div>
  );
}