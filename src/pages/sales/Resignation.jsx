import { useEffect, useState } from 'react';
import {
  FileText,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Ban,
  Info,
  Download,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Loader from '../../components/ui/Loader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { formatDate } from '../../utils/format.js';

/* =========================================================
   EMPLOYEE RESIGNATION PAGE
========================================================= */

export default function SalesResignation() {
  const { success, error: toastError } = useToast();

  const [resignation, setResignation] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Form */
  const [reason, setReason] = useState('');
  const [noticePeriod, setNoticePeriod] = useState(30);
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     LOAD
  ========================================================= */

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/resignations/my');
      setResignation(data.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     APPLY
  ========================================================= */

  const apply = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/resignations', {
        reason: reason.trim(),
        noticePeriodDays: Number(noticePeriod),
        lastWorkingDay,
      });
      success('Resignation submitted');
      setReason('');
      setNoticePeriod(30);
      setLastWorkingDay('');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to submit resignation'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     WITHDRAW
  ========================================================= */

  const withdraw = async () => {
    if (
      !confirm(
        'Are you sure you want to withdraw your resignation?'
      )
    ) {
      return;
    }

    try {
      await api.patch(
        `/resignations/${resignation._id}/withdraw`
      );
      success('Resignation withdrawn');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to withdraw'
      );
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <Loader text="Loading..." />;
  }

  /* =========================================================
     RENDER — If resignation exists
  ========================================================= */

  if (resignation) {
    return (
      <div className="space-y-5 pb-8">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FileText size={21} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                My Resignation
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Track your resignation status
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <Card>
          <div className="p-5">
            {/* Status Banner */}
            <div
              className={`
                rounded-lg border-2 p-4
                ${
                  resignation.status === 'Pending'
                    ? 'border-amber-200 bg-amber-50'
                    : resignation.status === 'Approved'
                    ? 'border-emerald-200 bg-emerald-50'
                    : resignation.status === 'Rejected'
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 bg-slate-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`
                    flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
                    ${
                      resignation.status === 'Pending'
                        ? 'bg-amber-100 text-amber-600'
                        : resignation.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-600'
                        : resignation.status === 'Rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-slate-100 text-slate-600'
                    }
                  `}
                >
                  {resignation.status === 'Pending' && (
                    <Clock size={20} />
                  )}
                  {resignation.status === 'Approved' && (
                    <CheckCircle2 size={20} />
                  )}
                  {resignation.status === 'Rejected' && (
                    <XCircle size={20} />
                  )}
                  {resignation.status === 'Withdrawn' && (
                    <Ban size={20} />
                  )}
                </div>

                <div className="flex-1">
                  <p
                    className={`
                      text-sm font-bold uppercase tracking-wider
                      ${
                        resignation.status === 'Pending'
                          ? 'text-amber-700'
                          : resignation.status === 'Approved'
                          ? 'text-emerald-700'
                          : resignation.status === 'Rejected'
                          ? 'text-red-700'
                          : 'text-slate-700'
                      }
                    `}
                  >
                    {resignation.status}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {resignation.status === 'Pending' &&
                      'Waiting for manager approval'}
                    {resignation.status === 'Approved' &&
                      'Your resignation has been approved'}
                    {resignation.status === 'Rejected' &&
                      'Your resignation was rejected'}
                    {resignation.status === 'Withdrawn' &&
                      'You withdrew this resignation'}
                  </p>
                </div>
              </div>

              {resignation.reviewNote && (
                <div className="mt-3 rounded-lg bg-white/60 px-3 py-2">
                  <p className="text-xs text-slate-600">
                    <strong>Manager Note:</strong>{' '}
                    {resignation.reviewNote}
                  </p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailBox
                label="Applied On"
                value={formatDate(resignation.appliedAt)}
              />
              <DetailBox
                label="Last Working Day"
                value={formatDate(resignation.lastWorkingDay)}
              />
              <DetailBox
                label="Notice Period"
                value={`${resignation.noticePeriodDays} days`}
              />
              {resignation.reviewedAt && (
                <DetailBox
                  label="Reviewed On"
                  value={formatDate(resignation.reviewedAt)}
                />
              )}
            </div>

            {/* Reason */}
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Reason
              </p>
              <p className="mt-1 text-sm text-slate-800">
                {resignation.reason}
              </p>
            </div>

            {/* Withdraw button */}
            {resignation.status === 'Pending' && (
              <div className="mt-5 flex justify-end">
                <button
                  onClick={withdraw}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                >
                  <Ban size={14} />
                  Withdraw Resignation
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  /* =========================================================
     RENDER — Apply form
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
              Resignation
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Submit your resignation request
            </p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Info size={15} />
          </div>
          <div className="text-xs text-blue-800">
            <p className="font-semibold">Please read before applying:</p>
            <ul className="mt-1.5 space-y-0.5 pl-4 list-disc">
              <li>Default notice period is 30 days</li>
              <li>Manager will review and approve/reject</li>
              <li>
                You can withdraw your resignation while pending
              </li>
              <li>Last working day must be in future</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={apply} className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Notice Period (days) *"
              type="number"
              min="0"
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
              required
            />

            <Input
              label="Last Working Day *"
              type="date"
              value={lastWorkingDay}
              onChange={(e) => setLastWorkingDay(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Reason for Resignation *
            </label>
            <textarea
              rows={5}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the reason..."
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="submit"
              loading={submitting}
              className="rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
            >
              <Send size={14} />
              Submit Resignation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function DetailBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}