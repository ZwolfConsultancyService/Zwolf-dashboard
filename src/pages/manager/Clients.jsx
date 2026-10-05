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
  'New Lead',
  'Contacted',
  'Discussion',
  'Proposal Sent',
  'Negotiation',
  'Confirmed',
  'Project Started',
  'Completed',
  'Lost',
];

const initialForm = {
  clientName: '',
  companyName: '',
  email: '',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  serviceRequired: '',
  description: '',
  clientStatus: 'New Lead',
  followUpDate: '',
  totalAmount: 0,
  password: '',
  assignedSales: '',
};

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

  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: 10,
      };

      if (search) {
        params.search = search;
      }

      if (status) {
        params.status = status;
      }

      if (assignedSales && user.role === 'manager') {
        params.assignedSales = assignedSales;
      }

      const { data } = await api.get('/clients', { params });

      setClients(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to load clients'
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    status,
    assignedSales,
    user.role,
    toastError,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user.role !== 'manager') return;

    api
      .get('/employees', {
        params: {
          role: 'sales',
          limit: 100,
        },
      })
      .then((res) => {
        setSalesUsers(res.data.data || []);
      })
      .catch(() => {
        setSalesUsers([]);
      });
  }, [user.role]);

  const openCreate = () => {
    setEditing(null);

    setForm({
      ...initialForm,
      password: '',
      assignedSales: '',
    });

    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);

    setForm({
      clientName: client.clientName || '',
      companyName: client.companyName || '',
      email: client.email || '',
      phone: client.phone || '',
      alternatePhone: client.alternatePhone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      serviceRequired: client.serviceRequired || '',
      description: client.description || '',
      clientStatus: client.clientStatus || 'New Lead',
      followUpDate: client.followUpDate
        ? client.followUpDate.slice(0, 10)
        : '',
      totalAmount: client.totalAmount || 0,
      password: '',
      assignedSales:
        client.assignedSales?._id ||
        client.assignedSales ||
        '',
    });

    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        ...form,
      };

      /*
       * Edit ke time agar password blank hai,
       * to backend ko password mat bhejo.
       *
       * Isse existing password same rahega.
       */
      if (
        editing &&
        (!payload.password ||
          !payload.password.trim())
      ) {
        delete payload.password;
      }

      if (editing) {
        await api.put(
          `/clients/${editing._id}`,
          payload
        );

        success('Client updated successfully');
      } else {
        await api.post('/clients', payload);

        success('Client created successfully');
      }

      setModalOpen(false);
      setEditing(null);
      setForm(initialForm);

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to save client'
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (client) => {
    if (
      !confirm(
        `Delete client "${client.clientName}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/clients/${client._id}`);

      success('Client deleted successfully');

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to delete client'
      );
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Clients
        </h1>

        <Button
          onClick={openCreate}
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
          <Plus
            size={18}
            strokeWidth={2.5}
          />

          Add Client
        </Button>
      </div>

      {/* Main Card */}
      <Card>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* Search */}
          <div className="relative">
            <Search
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
              size={16}
            />

            <input
              className="input-base pl-9"
              placeholder="Search name/company/phone"
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
            <option value="">
              All Statuses
            </option>

            {STATUSES.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </Select>

          {/* Assigned Sales */}
          {user.role === 'manager' && (
            <Select
              value={assignedSales}
              onChange={(e) => {
                setAssignedSales(e.target.value);
                setPage(1);
              }}
            >
              <option value="">
                All Sales
              </option>

              {salesUsers.map((sales) => (
                <option
                  key={sales._id}
                  value={sales._id}
                >
                  {sales.name}
                </option>
              ))}
            </Select>
          )}
        </div>

        {/* Clients Table */}
        <Table
          loading={loading}
          data={clients}
          columns={[
            {
              header: 'Client',
              render: (row) => (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/${user.role}/clients/${row._id}`
                    )
                  }
                  className="text-left"
                >
                  <p className="font-medium text-primary-600 hover:underline">
                    {row.clientName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {row.companyName || '—'}
                  </p>
                </button>
              ),
            },

            {
              header: 'Phone',
              key: 'phone',
            },

            {
              header: 'Status',
              render: (row) => (
                <Badge
                  color={statusColor(
                    row.clientStatus
                  )}
                >
                  {row.clientStatus}
                </Badge>
              ),
            },

            {
              header: 'Sales',
              render: (row) =>
                row.assignedSales?.name || '—',
            },

            {
              header: 'Total',
              render: (row) =>
                formatCurrency(
                  row.totalAmount
                ),
            },

            {
              header: 'Paid',
              render: (row) => (
                <span className="font-medium text-green-600">
                  {formatCurrency(
                    row.totalPaid
                  )}
                </span>
              ),
            },

            {
              header: 'Remaining',
              render: (row) => (
                <span
                  className={
                    row.remainingAmount > 0
                      ? 'font-medium text-red-600'
                      : 'font-medium text-gray-600'
                  }
                >
                  {formatCurrency(
                    row.remainingAmount
                  )}
                </span>
              ),
            },

            {
              header: 'Follow-up',
              render: (row) =>
                formatDate(
                  row.followUpDate
                ),
            },

            {
              header: 'Actions',
              className: 'text-right',
              render: (row) => (
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      openEdit(row)
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      remove(row)
                    }
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />

        <Pagination
          pagination={pagination}
          onPageChange={setPage}
        />
      </Card>

      {/* Client Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
          }
        }}
        title={
          editing
            ? 'Edit Client'
            : 'Add Client'
        }
        size="lg"
      >
        <form
          onSubmit={submit}
          className="space-y-6"
        >

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
                  handleChange(
                    'clientName',
                    e.target.value
                  )
                }
                required
              />

              <Input
                label="Company Name"
                value={form.companyName}
                onChange={(e) =>
                  handleChange(
                    'companyName',
                    e.target.value
                  )
                }
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  handleChange(
                    'email',
                    e.target.value
                  )
                }
              />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) =>
                  handleChange(
                    'phone',
                    e.target.value
                  )
                }
                required
              />

              <Input
                label="Alternate Phone"
                value={form.alternatePhone}
                onChange={(e) =>
                  handleChange(
                    'alternatePhone',
                    e.target.value
                  )
                }
              />

              <Input
                label="City"
                value={form.city}
                onChange={(e) =>
                  handleChange(
                    'city',
                    e.target.value
                  )
                }
              />

              <Input
                label="State"
                value={form.state}
                onChange={(e) =>
                  handleChange(
                    'state',
                    e.target.value
                  )
                }
              />

              <Input
                label="Service Required"
                value={form.serviceRequired}
                onChange={(e) =>
                  handleChange(
                    'serviceRequired',
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          {/* Client Portal Access */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Client Portal Access
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                These credentials will be used by the client
                to access their dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* Client ID */}
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
              <Input
                label={
                  editing
                    ? 'New Password'
                    : 'Client Portal Password'
                }
                type="password"
                value={form.password}
                onChange={(e) =>
                  handleChange(
                    'password',
                    e.target.value
                  )
                }
                placeholder={
                  editing
                    ? 'Leave blank to keep current password'
                    : 'Enter client login password'
                }
                required={!editing}
              />
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

              <p className="mt-0.5 text-xs text-gray-500">
                Manage client status, follow-up and payment
                information.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {/* Status */}
              <Select
                label="Status"
                value={form.clientStatus}
                onChange={(e) =>
                  handleChange(
                    'clientStatus',
                    e.target.value
                  )
                }
              >
                {STATUSES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </Select>

              {/* Follow-up */}
              <Input
                label="Follow-up Date"
                type="date"
                value={form.followUpDate}
                onChange={(e) =>
                  handleChange(
                    'followUpDate',
                    e.target.value
                  )
                }
              />

              {/* Total Amount */}
              <Input
                label="Total Amount (₹)"
                type="number"
                min="0"
                value={form.totalAmount}
                onChange={(e) =>
                  handleChange(
                    'totalAmount',
                    Number(e.target.value)
                  )
                }
              />

              {/* Assigned Sales */}
              {user.role === 'manager' && (
                <Select
                  label="Assigned Sales"
                  value={
                    form.assignedSales || ''
                  }
                  onChange={(e) =>
                    handleChange(
                      'assignedSales',
                      e.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select sales
                  </option>

                  {salesUsers.map((sales) => (
                    <option
                      key={sales._id}
                      value={sales._id}
                    >
                      {sales.name}
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
                handleChange(
                  'address',
                  e.target.value
                )
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

          {/* Additional Information */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Additional Information
              </h3>

              <p className="mt-0.5 text-xs text-gray-500">
                Add any additional notes or description
                about the client.
              </p>
            </div>

            <textarea
              rows="3"
              value={form.description}
              onChange={(e) =>
                handleChange(
                  'description',
                  e.target.value
                )
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
              disabled={saving}
              onClick={() =>
                setModalOpen(false)
              }
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
              {editing
                ? 'Update Client'
                : 'Create Client'}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}