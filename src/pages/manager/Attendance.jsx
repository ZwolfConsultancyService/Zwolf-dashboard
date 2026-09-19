import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays,
  Clock3,
  UserRound,
  ClipboardCheck,
  LogIn,
  LogOut,
  Timer,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatMinutes, formatDate } from '../../utils/format.js';

export default function ManagerAttendance() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = { page, limit: 15 };

      if (status) params.status = status;
      if (date) params.date = date;

      const { data } = await api.get('/attendance', { params });

      setRecords(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, status, date]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

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
                Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Monitor employee attendance and working hours
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <UserRound size={16} className="text-blue-600" />

            <span className="text-sm font-medium text-gray-600">
              {records.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDays size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Attendance Filters
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Filter employee attendance by date and status
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <CalendarDays size={13} />
                Date
              </label>

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

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <ClipboardCheck size={13} />
                Status
              </label>

              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl"
              >
                <option value="">All Statuses</option>
                <option>Present</option>
                <option>Absent</option>
                <option>Half Day</option>
                <option>Leave</option>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Clock3 size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Attendance Records
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Employee login, logout and working hours
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
                header: 'Employee',
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <UserRound size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {r.employee?.name || 'Unknown'}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {r.employee?.role || 'Employee'}
                      </p>
                    </div>
                  </div>
                ),
              },

              {
                header: 'Date',
                render: (r) => (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CalendarDays
                      size={15}
                      className="text-gray-400"
                    />
                    {formatDate(r.date)}
                  </div>
                ),
              },

              {
                header: 'Login',
                render: (r) => (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-600">
                      <LogIn size={14} />
                    </div>

                    {fmtTime(r.loginTime)}
                  </div>
                ),
              },

              {
                header: 'Logout',
                render: (r) => (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-600">
                      <LogOut size={14} />
                    </div>

                    {fmtTime(r.logoutTime)}
                  </div>
                ),
              },

              {
                header: 'Working',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Timer size={15} className="text-blue-500" />

                    <span className="font-semibold text-gray-800">
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