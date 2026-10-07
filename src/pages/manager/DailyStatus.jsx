import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays,
  ClipboardCheck,
  Clock3,
  UserRound,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
  Trash2,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

export default function ManagerDailyStatus() {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = { page, limit: 10 };

      if (date) params.date = date;

      const { data } = await api.get('/daily-status', { params });

      setRecords(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, date]);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     🆕 DELETE RECORD
  ========================================================= */

  const removeRecord = async (record) => {
    if (
      !confirm(
        `Delete daily status report of "${
          record.employee?.name || 'employee'
        }" on ${formatDate(record.date)}?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/daily-status/${record._id}`);
      success('Daily status deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to delete daily status'
      );
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ClipboardCheck size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Manager Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Daily Work Status
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review daily work updates submitted by employees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <ClipboardCheck size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              {records.length} Reports
            </span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Filter Reports
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Select a date to view employee status reports
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="w-full sm:max-w-xs">
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* Reports */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <ClipboardCheck size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Employee Reports
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Daily work progress, blockers and upcoming plans
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : records.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                <ClipboardCheck size={21} />
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-700">
                No status reports
              </p>

              <p className="mt-1 text-xs text-gray-500">
                No daily status submitted for this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((r) => (
                <div
                  key={r._id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  {/* Employee Header */}
                  <div className="border-b border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <UserRound size={20} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                            {r.employee?.name || 'Unknown Employee'}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                            <span>
                              {r.employee?.role || 'Employee'}
                            </span>

                            <span className="text-gray-300">•</span>

                            <span className="flex items-center gap-1">
                              <CalendarDays size={12} />
                              {formatDate(r.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge color="blue">
                          {r.status}
                        </Badge>

                        {/* 🆕 DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => removeRecord(r)}
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
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Section
                        title="Completed"
                        text={r.completedWork}
                        icon={CheckCircle2}
                        iconClass="bg-green-50 text-green-600"
                      />

                      <Section
                        title="In Progress"
                        text={r.workInProgress}
                        icon={Clock3}
                        iconClass="bg-blue-50 text-blue-600"
                      />

                      <Section
                        title="Pending"
                        text={r.pendingWork}
                        icon={LoaderCircle}
                        iconClass="bg-orange-50 text-orange-600"
                      />

                      <Section
                        title="Blockers"
                        text={r.blockers}
                        icon={AlertCircle}
                        iconClass="bg-red-50 text-red-600"
                      />

                      <Section
                        title="Next Plan"
                        text={r.nextPlan}
                        icon={ArrowRight}
                        iconClass="bg-purple-50 text-purple-600"
                        full
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
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
    </div>
  );
}

const Section = ({
  title,
  text,
  icon: Icon,
  iconClass,
  full = false,
}) => (
  <div
    className={`rounded-xl border border-gray-100 bg-gray-50/60 p-4 ${
      full ? 'md:col-span-2' : ''
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </p>

        <p className="mt-1 break-words whitespace-pre-wrap text-sm leading-6 text-gray-800">
          {text || '—'}
        </p>
      </div>
    </div>
  </div>
);