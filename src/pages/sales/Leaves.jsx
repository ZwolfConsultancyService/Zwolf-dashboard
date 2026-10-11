import { useEffect, useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  X,
  Ban,
  Sparkles,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

/* =========================================================
   CONSTANTS
========================================================= */

const LEAVE_TYPES = [
  { value: 'Casual', label: 'Casual Leave', paid: true },
  { value: 'Sick', label: 'Sick Leave', paid: true },
  { value: 'Earned', label: 'Earned Leave', paid: true },
  { value: 'Unpaid', label: 'Unpaid Leave', paid: false },
  { value: 'Other', label: 'Other', paid: true },
];

const initialForm = {
  type: 'Casual',
  fromDate: '',
  toDate: '',
  reason: '',
};

/* =========================================================
   EMPLOYEE LEAVES PAGE
========================================================= */

export default function SalesLeaves() {
  const { success, error: toastError } = useToast();

  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  /* =========================================================
     LOAD
  ========================================================= */

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;

      const [leavesRes, balanceRes] = await Promise.all([
        api.get('/leaves/my', { params }),
        api.get('/leaves/balance'),
      ]);

      setLeaves(leavesRes.data.data || []);
      setPagination(leavesRes.data.pagination || null);
      setStats(leavesRes.data.stats || null);
      setBalance(balanceRes.data.data || null);
    } catch (err) {
      toastError('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status]);

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/leaves', form);
      success('Leave application submitted');
      setModalOpen(false);
      setForm(initialForm);
      setPage(1);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to apply leave'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CANCEL
  ========================================================= */

  const cancelLeave = async (leave) => {
    if (
      !confirm(
        `Cancel this leave request?\n\n${formatDate(
          leave.fromDate
        )} → ${formatDate(leave.toDate)}`
      )
    ) {
      return;
    }

    try {
      await api.patch(`/leaves/${leave._id}/cancel`);
      success('Leave cancelled');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to cancel'
      );
    }
  };

  /* =========================================================
     OPEN MODAL
  ========================================================= */

  const openModal = () => {
    setForm(initialForm);
    setModalOpen(true);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar size={21} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                My Leaves
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Apply for leave and track your requests
              </p>
            </div>
          </div>

          <Button
            onClick={openModal}
            className="rounded-xl bg-indigo-600 font-semibold shadow-sm hover:bg-indigo-700"
          >
            <Plus size={16} />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="amber"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
            color="green"
          />
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
          <StatCard
            icon={Calendar}
            label="Days Taken"
            value={stats.totalDaysTaken}
            color="blue"
          />
        </div>
      )}

      {/* BALANCE */}
      {balance && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Leave Balance ({balance.year})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <BalanceBox
              label="Casual"
              used={balance.used.Casual}
              total={balance.quota.Casual}
              balance={balance.balance.Casual}
            />
            <BalanceBox
              label="Sick"
              used={balance.used.Sick}
              total={balance.quota.Sick}
              balance={balance.balance.Sick}
            />
            <BalanceBox
              label="Earned"
              used={balance.used.Earned}
              total={balance.quota.Earned}
              balance={balance.balance.Earned}
            />
            <BalanceBox
              label="Other"
              used={balance.used.Other}
              total={balance.quota.Other}
              balance={balance.balance.Other}
            />
          </div>
        </Card>
      )}

      {/* LEAVES LIST */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Leave History
            </h2>
          </div>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : leaves.length === 0 ? (
            <EmptyState onApply={openModal} />
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <LeaveCard
                  key={leave._id}
                  leave={leave}
                  onCancel={() => cancelLeave(leave)}
                />
              ))}
            </div>
          )}

          {pagination && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </Card>

      {/* APPLY MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for Leave"
        size="lg"
      >
        <form onSubmit={submit} className="space-y-5">
          <Select
            label="Leave Type *"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
          >
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
                {!t.paid ? ' (Unpaid)' : ''}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="From Date *"
              type="date"
              required
              value={form.fromDate}
              onChange={(e) =>
                setForm({ ...form, fromDate: e.target.value })
              }
            />
            <Input
              label="To Date *"
              type="date"
              required
              value={form.toDate}
              onChange={(e) =>
                setForm({ ...form, toDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reason *
            </label>
            <textarea
              rows={4}
              required
              value={form.reason}
              onChange={(e) =>
                setForm({ ...form, reason: e.target.value })
              }
              placeholder="Explain why you need this leave..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors[color]}`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">
            {value || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BALANCE BOX
========================================================= */

function BalanceBox({ label, used, total, balance }) {
  const usedPct = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900">{balance}</p>
        <p className="text-xs text-gray-500">
          {used} / {total} used
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   LEAVE CARD
========================================================= */

function LeaveCard({ leave, onCancel }) {
  const statusConfig = {
    Pending: {
      color: 'amber',
      icon: Clock,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    Approved: {
      color: 'green',
      icon: CheckCircle2,
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    Rejected: {
      color: 'red',
      icon: XCircle,
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    Cancelled: {
      color: 'gray',
      icon: Ban,
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-200',
    },
  };

  const cfg = statusConfig[leave.status] || statusConfig.Pending;
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${cfg.border}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text}`}
          >
            <Icon size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="indigo">{leave.type}</Badge>

              <span
                className={`rounded-full ${cfg.bg} ${cfg.text} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide`}
              >
                {leave.status}
              </span>

              {!leave.isPaid && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
                  Unpaid
                </span>
              )}
            </div>

            <p className="mt-2 text-sm font-semibold text-gray-900">
              {formatDate(leave.fromDate)} →{' '}
              {formatDate(leave.toDate)}
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({leave.totalDays} day
                {leave.totalDays > 1 ? 's' : ''})
              </span>
            </p>

            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {leave.reason}
            </p>

            {leave.reviewNote && (
              <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <strong>Manager Note:</strong> {leave.reviewNote}
              </p>
            )}

            <p className="mt-2 text-[11px] text-gray-400">
              Applied on {formatDate(leave.appliedAt || leave.createdAt)}
            </p>
          </div>
        </div>

        {leave.status === 'Pending' && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <X size={12} className="mr-1 inline" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ onApply }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-10 text-center">
      <Calendar size={40} className="mx-auto text-gray-300" />
      <p className="mt-3 text-sm font-semibold text-gray-700">
        No leave requests yet
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Apply for your first leave
      </p>
      <Button
        onClick={onApply}
        size="sm"
        className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700"
      >
        <Plus size={14} />
        Apply Leave
      </Button>
    </div>
  );
}