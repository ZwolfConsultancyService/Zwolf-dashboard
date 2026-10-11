import { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  UserRound,
  Check,
  X,
  Eye,
  Trash2,
  Filter,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

/* =========================================================
   MANAGER LEAVES PAGE
========================================================= */

export default function ManagerLeaves() {
  const { success, error: toastError } = useToast();

  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Pending');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  /* Review modal */
  const [reviewModal, setReviewModal] = useState({
    open: false,
    leave: null,
    action: 'Approved',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     LOAD
  ========================================================= */

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;
      if (type) params.type = type;

      const { data } = await api.get('/leaves', { params });

      setLeaves(data.data || []);
      setPagination(data.pagination || null);
      setStats(data.stats || null);
    } catch (err) {
      toastError('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status, type]);

  /* =========================================================
     OPEN REVIEW
  ========================================================= */

  const openReview = (leave, action) => {
    setReviewModal({
      open: true,
      leave,
      action,
      note: '',
    });
  };

  /* =========================================================
     SUBMIT REVIEW
  ========================================================= */

  const submitReview = async () => {
    const { leave, action, note } = reviewModal;

    if (!leave) return;

    setSubmitting(true);

    try {
      await api.patch(`/leaves/${leave._id}/review`, {
        status: action,
        reviewNote: note,
      });

      success(`Leave ${action.toLowerCase()}`);
      setReviewModal({
        open: false,
        leave: null,
        action: 'Approved',
        note: '',
      });
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const removeLeave = async (leave) => {
    if (
      !confirm(
        `Delete this leave request from ${
          leave.employee?.name || 'employee'
        }?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/leaves/${leave._id}`);
      success('Leave deleted');
      load();
    } catch (err) {
      toastError('Failed to delete');
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6 pb-8">
      {/* HEADER */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Calendar size={21} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Leave Requests
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Review and manage employee leave requests
            </p>
          </div>
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
            icon={UserRound}
            label="On Leave Today"
            value={stats.todayApproved}
            color="blue"
          />
        </div>
      )}

      {/* FILTERS + LIST */}
      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Leave Requests
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-40"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </Select>

            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-40"
            >
              <option value="">All Types</option>
              <option value="Casual">Casual</option>
              <option value="Sick">Sick</option>
              <option value="Earned">Earned</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Other">Other</option>
            </Select>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : leaves.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-10 text-center">
              <Calendar size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm font-semibold text-gray-700">
                No leave requests
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <LeaveRequestCard
                  key={leave._id}
                  leave={leave}
                  onApprove={() =>
                    openReview(leave, 'Approved')
                  }
                  onReject={() =>
                    openReview(leave, 'Rejected')
                  }
                  onDelete={() => removeLeave(leave)}
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

      {/* REVIEW MODAL */}
      <Modal
        open={reviewModal.open}
        onClose={() =>
          setReviewModal({
            open: false,
            leave: null,
            action: 'Approved',
            note: '',
          })
        }
        title={`${reviewModal.action} Leave`}
      >
        {reviewModal.leave && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <UserRound size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {reviewModal.leave.employee?.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {reviewModal.leave.employee?.role} ·{' '}
                    {reviewModal.leave.type}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">From</p>
                  <p className="mt-0.5 font-semibold text-gray-800">
                    {formatDate(reviewModal.leave.fromDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">To</p>
                  <p className="mt-0.5 font-semibold text-gray-800">
                    {formatDate(reviewModal.leave.toDate)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Total Days</p>
                  <p className="mt-0.5 font-semibold text-gray-800">
                    {reviewModal.leave.totalDays} day
                    {reviewModal.leave.totalDays > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-white px-3 py-2">
                <p className="text-xs text-gray-500">Reason</p>
                <p className="mt-0.5 text-sm text-gray-800">
                  {reviewModal.leave.reason}
                </p>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Review Note (optional)
              </label>
              <textarea
                rows={3}
                value={reviewModal.note}
                onChange={(e) =>
                  setReviewModal({
                    ...reviewModal,
                    note: e.target.value,
                  })
                }
                placeholder={
                  reviewModal.action === 'Rejected'
                    ? 'Reason for rejection...'
                    : 'Any note for the employee...'
                }
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setReviewModal({
                    open: false,
                    leave: null,
                    action: 'Approved',
                    note: '',
                  })
                }
                disabled={submitting}
                className="rounded-xl px-5"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={submitting}
                onClick={submitReview}
                className={`rounded-xl px-6 font-semibold text-white ${
                  reviewModal.action === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewModal.action === 'Approved' ? (
                  <>
                    <Check size={14} />
                    Approve Leave
                  </>
                ) : (
                  <>
                    <X size={14} />
                    Reject Leave
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
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
   LEAVE REQUEST CARD
========================================================= */

function LeaveRequestCard({
  leave,
  onApprove,
  onReject,
  onDelete,
}) {
  const statusConfig = {
    Pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    Approved: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    },
    Rejected: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
  };

  const cfg = statusConfig[leave.status] || statusConfig.Pending;

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${cfg.border}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* LEFT */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UserRound size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {leave.employee?.name || 'Employee'}
              </p>

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

            <p className="mt-1 text-xs text-gray-500">
              {leave.employee?.role}
              {leave.employee?.department &&
                ` · ${leave.employee.department}`}
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-900">
              {formatDate(leave.fromDate)} →{' '}
              {formatDate(leave.toDate)}
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({leave.totalDays} day
                {leave.totalDays > 1 ? 's' : ''})
              </span>
            </p>

            <p className="mt-1 line-clamp-1 text-sm text-gray-600">
              {leave.reason}
            </p>

            {leave.reviewNote && (
              <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <strong>Note:</strong> {leave.reviewNote}
              </p>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {leave.status === 'Pending' ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600 transition hover:bg-green-100"
              >
                <Check size={13} />
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <X size={13} />
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}