import { useEffect, useState, useCallback } from 'react';
import {
  LogIn,
  LogOut,
  CalendarCheck2,
  Clock3,
  Timer,
  History,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatMinutes, formatDate } from '../../utils/format.js';

export default function SalesAttendance() {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/attendance/my', {
        params: {
          page,
          limit: 10,
        },
      });

      setRecords(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const doAction = async (action) => {
    setActionLoading(true);

    try {
      await api.post(`/attendance/${action}`);

      success(
        `Successfully ${
          action === 'check-in' ? 'checked in' : 'checked out'
        }`
      );

      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CalendarCheck2 size={21} />
            </div>

            <div className="min-w-0">
            

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                My Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your daily check-in, check-out and attendance history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <History size={16} className="text-blue-600" />

            <span className="text-sm font-medium text-gray-600">
              {records.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Actions */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <Clock3 size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Attendance Actions
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Mark your attendance for the current working day
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => doAction('check-in')}
              loading={actionLoading}
            >
              <LogIn size={16} />
              Check In
            </Button>

            <Button
              variant="secondary"
              onClick={() => doAction('check-out')}
              loading={actionLoading}
            >
              <LogOut size={16} />
              Check Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance History */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <History size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Attendance History
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Review your previous attendance records
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <Table
            loading={loading}
            data={records}
            columns={[
              {
                header: 'Date',
                render: (r) => (
                  <div className="flex min-w-[130px] items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <CalendarCheck2 size={15} />
                    </div>

                    <span className="text-sm text-gray-700">
                      {formatDate(r.date)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Login',
                render: (r) => (
                  <div className="flex min-w-[110px] items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <LogIn size={15} />
                    </div>

                    <span className="text-sm font-medium text-gray-700">
                      {fmtTime(r.loginTime)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Logout',
                render: (r) => (
                  <div className="flex min-w-[110px] items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <LogOut size={15} />
                    </div>

                    <span className="text-sm font-medium text-gray-700">
                      {fmtTime(r.logoutTime)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Working',
                render: (r) => (
                  <div className="flex min-w-[120px] items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <Timer size={15} />
                    </div>

                    <span className="text-sm font-medium text-gray-700">
                      {formatMinutes(r.workingMinutes)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Status',
                render: (r) => (
                  <Badge color={statusColor(r.status)}>
                    {r.status}
                  </Badge>
                ),
              },
            ]}
          />
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}