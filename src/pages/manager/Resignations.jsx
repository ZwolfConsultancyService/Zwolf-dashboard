import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  UserRound,
  Check,
  X,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

/* =========================================================
   MANAGER RESIGNATIONS PAGE
========================================================= */

export default function ManagerResignations() {
  const { success, error: toastError } = useToast();

  const [resignations, setResignations] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(false);

  /* Review modal */
  const [reviewModal, setReviewModal] = useState({
    open: false,
    resignation: null,
    action: 'Approved',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     LOAD
  ========================================================= */

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;

      const { data } = await api.get('/resignations', { params });

      setResignations(data.data || []);
      setPagination(data.pagination || null);
      setStats(data.stats || null);
    } catch (err) {
      console.error(err);
      toastError('Failed to load resignations');
    } finally {
      setLoading(false);
    }
  }, [page, status, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     REVIEW
  ========================================================= */

  const openReview = (resignation, action) => {
    setReviewModal({
      open: true,
      resignation,
      action,
      note: '',
    });
  };

  const submitReview = async () => {
    const { resignation, action, note } = reviewModal;

    if (!resignation) return;

    setSubmitting(true);

    try {
      await api.patch(
        `/resignations/${resignation._id}/review`,
        {
          status: action,
          reviewNote: note,
        }
      );

      success(`Resignation ${action.toLowerCase()}`);
      setReviewModal({
        open: false,
        resignation: null,
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

  const remove = async (resignation) => {
    if (
      !confirm(
        `Delete resignation request from ${resignation.employee?.name}?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/resignations/${resignation._id}`);
      success('Resignation deleted');
      load();
    } catch (err) {
      toastError('Failed to delete');
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <FileText size={21} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Resignations
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Review employee resignation requests
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
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
            color="emerald"
          />
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
        </div>
      )}

      {/* List */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Resignation Requests
            </h2>
          </div>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Withdrawn">Withdrawn</option>
          </Select>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : resignations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <FileText
                size={32}
                className="mx-auto text-slate-300"
              />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No resignations
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Employee resignations will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resignations.map((r) => (
                <ResignationCard
                  key={r._id}
                  resignation={r}
                  onApprove={() => openReview(r, 'Approved')}
                  onReject={() => openReview(r, 'Rejected')}
                  onDelete={() => remove(r)}
                />
              ))}
            </div>
          )}

          {pagination && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        open={reviewModal.open}
        onClose={() =>
          setReviewModal({
            open: false,
            resignation: null,
            action: 'Approved',
            note: '',
          })
        }
        title={`${reviewModal.action} Resignation`}
      >
        {reviewModal.resignation && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <UserRound size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {reviewModal.resignation.employee?.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {reviewModal.resignation.employee?.role}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Last Working Day</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {formatDate(
                      reviewModal.resignation.lastWorkingDay
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Notice Period</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {reviewModal.resignation.noticePeriodDays} days
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-white px-3 py-2">
                <p className="text-xs text-slate-500">Reason</p>
                <p className="mt-0.5 text-sm text-slate-800">
                  {reviewModal.resignation.reason}
                </p>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
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
                    : 'Any note for employee...'
                }
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setReviewModal({
                    open: false,
                    resignation: null,
                    action: 'Approved',
                    note: '',
                  })
                }
                disabled={submitting}
                className="rounded-lg px-5"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={submitting}
                onClick={submitReview}
                className={`rounded-lg px-6 font-semibold text-white ${
                  reviewModal.action === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewModal.action === 'Approved' ? (
                  <>
                    <Check size={14} />
                    Approve
                  </>
                ) : (
                  <>
                    <X size={14} />
                    Reject
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
   HELPERS
========================================================= */

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors[color]}`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">
            {value || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResignationCard({
  resignation,
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
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    Rejected: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    Withdrawn: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
  };

  const cfg = statusConfig[resignation.status] || statusConfig.Pending;

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md ${cfg.border}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <UserRound size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">
                {resignation.employee?.name}
              </p>

              <span
                className={`rounded-full ${cfg.bg} ${cfg.text} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide`}
              >
                {resignation.status}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {resignation.employee?.role}
              {resignation.employee?.department &&
                ` · ${resignation.employee.department}`}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                Last Day: {formatDate(resignation.lastWorkingDay)}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                Notice: {resignation.noticePeriodDays} days
              </span>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {resignation.reason}
            </p>

            {resignation.reviewNote && (
              <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <strong>Note:</strong> {resignation.reviewNote}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {resignation.status === 'Pending' ? (
            <>
              <button
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
              >
                <Check size={13} />
                Approve
              </button>

              <button
                onClick={onReject}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                <X size={13} />
                Reject
              </button>
            </>
          ) : (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
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