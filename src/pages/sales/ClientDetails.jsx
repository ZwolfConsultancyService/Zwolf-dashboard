import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  MessageSquare,
  Plus,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  Building2,
  BriefcaseBusiness,
  CircleDollarSign,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../utils/format.js';

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

const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
  'Other',
];

export default function SalesClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [payModal, setPayModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    transactionId: '',
    notes: '',
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  const [noteText, setNoteText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [c, p, pr] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get(`/payments/client/${id}`),
        api.get('/projects', { params: { limit: 100 } }),
      ]);

      setClient(c.data.data);
      setNewStatus(c.data.data.clientStatus);
      setPayments(p.data.data);

      setProjects(
        pr.data.data.filter(
          (x) => (x.client?._id || x.client) === id
        )
      );
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load'
      );
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const submitPayment = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/payments', {
        ...payForm,
        amount: Number(payForm.amount),
        client: id,
      });

      success('Payment added');
      setPayModal(false);

      setPayForm({
        amount: '',
        paymentMethod: 'UPI',
        transactionId: '',
        notes: '',
        paymentDate: new Date().toISOString().slice(0, 10),
      });

      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const submitNote = async (e) => {
    e.preventDefault();

    if (!noteText.trim()) return;

    setSaving(true);

    try {
      await api.post(`/clients/${id}/notes`, {
        text: noteText,
      });

      success('Note added');
      setNoteModal(false);
      setNoteText('');
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const submitStatus = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/clients/${id}`, {
        clientStatus: newStatus,
      });

      if (statusNote.trim()) {
        await api.post(`/clients/${id}/notes`, {
          text: `Status changed to "${newStatus}": ${statusNote}`,
        });
      }

      success('Status updated');
      setStatusModal(false);
      setStatusNote('');
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!client) return null;

  const paidPercent =
    client.totalAmount > 0
      ? Math.min(
          100,
          Math.round(
            (client.totalPaid / client.totalAmount) * 100
          )
        )
      : 0;

  return (
    <div className="space-y-5">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* Client Heading */}
          <div className="flex items-start gap-4">

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="
                mt-0.5
                shrink-0
                rounded-xl
                border-gray-200
                bg-white
                px-3
                shadow-sm
                hover:bg-gray-50
              "
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {client.clientName}
                </h1>

                <Badge color={statusColor(client.clientStatus)}>
                  {client.clientStatus}
                </Badge>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {client.companyName && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} />
                    {client.companyName}
                  </span>
                )}

                {client.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={14} />
                    {client.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">

            <Button
              variant="outline"
              onClick={() => setStatusModal(true)}
              className="rounded-xl"
            >
              Change Status
            </Button>

            <Button
              variant="success"
              onClick={() => setPayModal(true)}
              disabled={client.remainingAmount <= 0}
              className="rounded-xl"
            >
              <Wallet size={17} />
              Add Payment
            </Button>

            <Button
              variant="secondary"
              onClick={() => setNoteModal(true)}
              className="rounded-xl"
            >
              <MessageSquare size={17} />
              Add Note
            </Button>

          </div>
        </div>
      </div>


      {/* =====================================================
          FINANCIAL SUMMARY
      ===================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Amount
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(client.totalAmount)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CircleDollarSign size={20} />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Total project value
          </p>
        </div>


        {/* Paid */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Paid
              </p>

              <p className="mt-2 text-2xl font-bold text-green-600">
                {formatCurrency(client.totalPaid)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Wallet size={20} />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Payment progress
              </span>

              <span className="text-xs font-semibold text-green-600">
                {paidPercent}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        </div>


        {/* Unpaid */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Unpaid
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  client.remainingAmount > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {formatCurrency(client.remainingAmount)}
              </p>
            </div>

            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                client.remainingAmount > 0
                  ? 'bg-red-50 text-red-600'
                  : 'bg-green-50 text-green-600'
              }`}
            >
              <CircleDollarSign size={20} />
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {client.remainingAmount > 0
              ? 'Outstanding amount'
              : 'Payment completed'}
          </p>
        </div>


        {/* Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Current Status
              </p>

              <div className="mt-3">
                <Badge color={statusColor(client.clientStatus)}>
                  {client.clientStatus}
                </Badge>
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BriefcaseBusiness size={20} />
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Client pipeline stage
          </p>
        </div>

      </div>


      {/* =====================================================
          CLIENT INFORMATION
      ===================================================== */}
      <Card title="Client Information">
        <div className="grid grid-cols-1 gap-5 p-1 sm:grid-cols-2">

          <Info
            icon={<Mail size={16} />}
            label="Email"
            value={client.email}
          />

          <Info
            icon={<Phone size={16} />}
            label="Phone"
            value={client.phone}
          />

          <Info
            icon={<Phone size={16} />}
            label="Alternate Phone"
            value={client.alternatePhone}
          />

          <Info
            icon={<MapPin size={16} />}
            label="City / State"
            value={`${client.city || '—'} / ${client.state || '—'}`}
          />

          <Info
            icon={<BriefcaseBusiness size={16} />}
            label="Service Required"
            value={client.serviceRequired}
          />

          <Info
            icon={<CalendarDays size={16} />}
            label="Follow-up Date"
            value={formatDate(client.followUpDate)}
          />

          <div className="sm:col-span-2">
            <Info
              icon={<MapPin size={16} />}
              label="Address"
              value={client.address}
            />
          </div>

          <div className="sm:col-span-2">
            <Info
              label="Description / Requirements"
              value={client.description}
            />
          </div>

        </div>
      </Card>


      {/* =====================================================
          PAYMENT HISTORY
      ===================================================== */}
      <Card title={`Payment History (${payments.length})`}>
        {payments.length === 0 ? (
          <EmptyState
            icon={<Wallet size={20} />}
            title="No payments yet"
            description="Payment transactions for this client will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[850px] w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Method
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Transaction ID
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Notes
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Added By
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {payments.map((p) => (
                  <tr
                    key={p._id}
                    className="transition-colors hover:bg-gray-50/70"
                  >
                    <td className="px-4 py-3.5 text-sm text-gray-700">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="px-4 py-3.5 text-sm font-semibold text-green-600">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="px-4 py-3.5">
                      <Badge>{p.paymentMethod}</Badge>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-gray-600">
                      {p.transactionId || '—'}
                    </td>

                    <td className="max-w-[220px] px-4 py-3.5 text-xs text-gray-600">
                      <span className="line-clamp-2">
                        {p.notes || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-sm text-gray-700">
                      {p.createdBy?.name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>


      {/* =====================================================
          PROJECTS
      ===================================================== */}
      <Card title={`Projects (${projects.length})`}>
        {projects.length === 0 ? (
          <EmptyState
            icon={<BriefcaseBusiness size={20} />}
            title="No projects yet"
            description="Projects associated with this client will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {projects.map((p) => (
              <button
                key={p._id}
                onClick={() =>
                  navigate(`/sales/projects/${p._id}`)
                }
                className="
                  group
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  p-4
                  text-left
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-blue-300
                  hover:shadow-md
                "
              >
                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                      {p.projectName}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Project Progress
                    </p>
                  </div>

                  <Badge color={statusColor(p.status)}>
                    {p.status}
                  </Badge>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Progress
                    </span>

                    <span className="text-xs font-semibold text-blue-600">
                      {p.progress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>


      {/* =====================================================
          NOTES & REQUIREMENTS
      ===================================================== */}
      <Card
        title={`Notes & Requirements (${client.notes?.length || 0})`}
      >
        {!client.notes?.length ? (
          <EmptyState
            icon={<MessageSquare size={20} />}
            title="No notes yet"
            description="Client notes and requirement updates will appear here."
          />
        ) : (
          <div className="space-y-3">
            {client.notes
              .slice()
              .reverse()
              .map((n, i) => (
                <div
                  key={i}
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50/60
                    p-4
                    transition-colors
                    hover:bg-gray-50
                  "
                >
                  <div className="flex items-start gap-3">

                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <MessageSquare size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {n.text}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                        <CalendarDays size={13} />
                        {formatDateTime(n.createdAt)}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>


      {/* =====================================================
          PAYMENT MODAL
      ===================================================== */}
      <Modal
        open={payModal}
        onClose={() => setPayModal(false)}
        title="Add Payment"
      >
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Wallet size={16} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {client.clientName}
              </p>

              <p className="text-xs text-gray-500">
                Add a new payment transaction
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">

            <SummaryItem
              label="Total"
              value={formatCurrency(client.totalAmount)}
            />

            <SummaryItem
              label="Paid"
              value={formatCurrency(client.totalPaid)}
              valueClass="text-green-600"
            />

            <SummaryItem
              label="Unpaid"
              value={formatCurrency(client.remainingAmount)}
              valueClass="text-red-600"
            />

          </div>
        </div>

        <form
          onSubmit={submitPayment}
          className="space-y-4"
        >
          <Input
            label="Amount (₹)"
            type="number"
            required
            value={payForm.amount}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                amount: e.target.value,
              })
            }
            hint={`Maximum: ${formatCurrency(
              client.remainingAmount
            )}`}
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

          <TextareaField
            label="Notes"
            rows={3}
            value={payForm.notes}
            onChange={(e) =>
              setPayForm({
                ...payForm,
                notes: e.target.value,
              })
            }
            placeholder="Add payment notes..."
          />

          <ModalActions
            onCancel={() => setPayModal(false)}
            loading={saving}
            submitText="Save Payment"
            submitVariant="success"
          />
        </form>
      </Modal>


      {/* =====================================================
          STATUS MODAL
      ===================================================== */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Client Status"
      >
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">

          <p className="text-sm font-semibold text-gray-900">
            {client.clientName}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Current status:
            </span>

            <Badge color={statusColor(client.clientStatus)}>
              {client.clientStatus}
            </Badge>
          </div>
        </div>

        <form
          onSubmit={submitStatus}
          className="space-y-4"
        >
          <Select
            label="New Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>

          <TextareaField
            label="Note"
            optional
            rows={4}
            placeholder="Add a note about this status change..."
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />

         <ModalActions
  onCancel={() => setStatusModal(false)}
  loading={saving}
  submitText="Update Status"
/>
        </form>
      </Modal>


      {/* =====================================================
          NOTE MODAL
      ===================================================== */}
      <Modal
        open={noteModal}
        onClose={() => setNoteModal(false)}
        title="Add Note / Requirement"
      >
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <MessageSquare size={16} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {client.clientName}
              </p>

              <p className="text-xs text-gray-500">
                Add requirement, discussion or client update.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={submitNote}
          className="space-y-4"
        >
          <TextareaField
            label="Note / Requirement"
            required
            rows={6}
            placeholder="Enter client requirement, discussion notes or any important update..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />

          <ModalActions
            onCancel={() => setNoteModal(false)}
            loading={saving}
            submitText="Add Note"
          />
        </form>
      </Modal>

    </div>
  );
}


/* ============================================================
   INFO COMPONENT
============================================================ */

const Info = ({ icon, label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {icon && (
        <span className="text-gray-400">
          {icon}
        </span>
      )}

      {label}
    </div>

    <div className="mt-2 break-words text-sm font-medium leading-6 text-gray-800">
      {value || '—'}
    </div>
  </div>
);


/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyState = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-10 text-center">

    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      {icon}
    </div>

    <p className="mt-3 text-sm font-semibold text-gray-900">
      {title}
    </p>

    <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
      {description}
    </p>
  </div>
);


/* ============================================================
   SUMMARY ITEM
============================================================ */

const SummaryItem = ({
  label,
  value,
  valueClass = 'text-gray-900',
}) => (
  <div className="rounded-lg border border-white bg-white/70 p-3">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
      {label}
    </p>

    <p className={`mt-1 text-sm font-bold ${valueClass}`}>
      {value}
    </p>
  </div>
);


/* ============================================================
   TEXTAREA
============================================================ */

const TextareaField = ({
  label,
  optional = false,
  required = false,
  ...props
}) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700">
      {label}

      {required && (
        <span className="ml-1 text-red-500">*</span>
      )}

      {optional && (
        <span className="ml-1 font-normal text-gray-400">
          (Optional)
        </span>
      )}
    </label>

    <textarea
      {...props}
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
);


/* ============================================================
   MODAL ACTIONS
============================================================ */
const ModalActions = ({
  onCancel,
  loading,
  submitText,
  submitVariant = 'primary',
}) => (
  <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      className="rounded-xl px-5"
    >
      Cancel
    </Button>

    <Button
      type="submit"
      loading={loading}
      variant={submitVariant}
      className="
        rounded-xl
        bg-blue-600
        px-6
        py-2.5
        font-semibold
        text-white
        shadow-[0_4px_12px_rgba(37,99,235,0.18)]
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:bg-blue-700
        hover:shadow-[0_6px_18px_rgba(37,99,235,0.25)]
        focus:outline-none
        focus:ring-4
        focus:ring-blue-500/20
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >
      {submitText}
    </Button>

  </div>
);