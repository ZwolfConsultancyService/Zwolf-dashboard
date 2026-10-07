import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays,
  Clock3,
  UserRound,
  ClipboardCheck,
  LogIn,
  LogOut,
  Timer,
  Trash2,
  Download,
} from 'lucide-react';

import * as XLSX from 'xlsx';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatMinutes, formatDate } from '../../utils/format.js';

export default function ManagerAttendance() {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  /* =========================================================
     🆕 DELETE SINGLE RECORD
  ========================================================= */

  const removeRecord = async (record) => {
    if (
      !confirm(
        `Delete attendance record for "${
          record.employee?.name || 'employee'
        }" on ${formatDate(record.date)}?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/attendance/${record._id}`);
      success('Attendance record deleted');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to delete record'
      );
    }
  };

  /* =========================================================
     🆕 DELETE ALL (filtered)
  ========================================================= */

  const removeAll = async () => {
    const filterDesc =
      date || status
        ? `with current filters${date ? ` (Date: ${date})` : ''}${
            status ? ` (Status: ${status})` : ''
          }`
        : 'ALL';

    if (
      !confirm(
        `⚠️ Delete ${filterDesc} attendance records?\n\nThis will permanently delete all matching records. This action cannot be undone.`
      )
    ) {
      return;
    }

    /* Double confirm */
    if (
      !confirm(
        'Are you absolutely sure? This cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const params = {};
      if (date) params.date = date;
      if (status) params.status = status;

      await api.delete('/attendance/delete-all', { params });

      success('Attendance records deleted');
      setPage(1);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to delete records'
      );
    } finally {
      setDeleting(false);
    }
  };

  /* =========================================================
     🆕 EXPORT TO EXCEL
  ========================================================= */

  const exportToExcel = async () => {
    try {
      setExporting(true);

      /* Fetch all records matching filters (not just current page) */
      const params = { page: 1, limit: 1000 };
      if (status) params.status = status;
      if (date) params.date = date;

      const { data } = await api.get('/attendance', { params });

      const allRecords = data.data || [];

      if (allRecords.length === 0) {
        toastError('No records to export');
        return;
      }

      /* Build Excel rows */
      const rows = allRecords.map((r, idx) => ({
        'S.No': idx + 1,
        Employee: r.employee?.name || '—',
        Role: r.employee?.role || '—',
        Date: r.date ? formatDate(r.date) : '—',
        'Login Time': fmtTime(r.loginTime),
        'Logout Time': fmtTime(r.logoutTime),
        'Working Hours': formatMinutes(r.workingMinutes),
        Status: r.status || '—',
      }));

      /* Create worksheet + workbook */
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

      /* Set column widths */
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 22 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 12 },
      ];

      /* File name with date filter */
      const fileName = date
        ? `attendance-${date}.xlsx`
        : `attendance-${new Date().toISOString().slice(0, 10)}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      success('Excel exported successfully');
    } catch (err) {
      console.error('export err:', err);
      toastError('Failed to export');
    } finally {
      setExporting(false);
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
                Attendance
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Monitor employee attendance and working hours
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Button */}
            <button
              type="button"
              onClick={exportToExcel}
              disabled={exporting || loading}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                px-4
                py-2.5
                text-sm
                font-semibold
                text-emerald-700
                transition-all
                duration-200
                hover:border-emerald-300
                hover:bg-emerald-100
                focus:outline-none
                focus:ring-2
                focus:ring-emerald-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>

            {/* Delete All Button */}
            <button
              type="button"
              onClick={removeAll}
              disabled={deleting || records.length === 0}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-2.5
                text-sm
                font-semibold
                text-red-600
                transition-all
                duration-200
                hover:border-red-300
                hover:bg-red-100
                focus:outline-none
                focus:ring-2
                focus:ring-red-500/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              title="Delete all filtered records"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete All'}
            </button>

            {/* Records Count */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
              <UserRound size={16} className="text-blue-600" />

              <span className="text-sm font-medium text-gray-600">
                {records.length} Records
              </span>
            </div>
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

              /* 🆕 DELETE ACTION */
              {
                header: 'Actions',
                className: 'text-right',
                render: (r) => (
                  <div className="flex justify-end">
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