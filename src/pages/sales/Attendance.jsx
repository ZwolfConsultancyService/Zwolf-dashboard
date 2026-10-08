import { useEffect, useState, useCallback } from 'react';
import {
  LogIn,
  LogOut,
  CalendarCheck2,
  Clock3,
  Timer,
  History,
  PartyPopper,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import FaceCheckIn from '../../components/FaceCheckIn.jsx';
import { formatMinutes, formatDate } from '../../utils/format.js';

/* =========================================================
   HELPERS
========================================================= */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SalesAttendance() {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* 🆕 Calendar state */
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [todayHoliday, setTodayHoliday] = useState(null);

  /* =========================================================
     LOAD ATTENDANCE
  ========================================================= */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/attendance/my', {
        params: { page, limit: 10 },
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

  /* =========================================================
     🆕 LOAD HOLIDAYS
  ========================================================= */

  useEffect(() => {
    const loadHolidays = async () => {
      try {
        /* Current month holidays */
        const { data } = await api.get(
          `/holidays?year=${calYear}&month=${calMonth + 1}&limit=100`
        );

        setHolidays(data.data || []);
      } catch (err) {
        console.error('holidays load err:', err);
      }
    };

    loadHolidays();
  }, [calMonth, calYear]);

  /* Upcoming + Today */
  useEffect(() => {
    const loadUpcoming = async () => {
      try {
        const { data } = await api.get(
          '/holidays/my?upcoming=true'
        );

        const list = data.data || [];

        setUpcomingHolidays(list.slice(0, 5));

        /* Today holiday? */
        const today = new Date();
        const found = list.find((h) => isSameDay(h.date, today));

        setTodayHoliday(found || null);
      } catch (err) {
        console.error('upcoming holidays err:', err);
      }
    };

    loadUpcoming();
  }, []);

  /* =========================================================
     ACTIONS
  ========================================================= */

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

  /* =========================================================
     CALENDAR BUILD
  ========================================================= */

  const buildCalendar = () => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDay = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const days = [];

    /* Empty days before first */
    for (let i = 0; i < startDay; i++) {
      days.push({ empty: true, key: `e-${i}` });
    }

    /* Days of month */
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const dayOfWeek = date.getDay();

      const holiday = holidays.find((h) =>
        isSameDay(h.date, date)
      );

      days.push({
        key: `d-${d}`,
        day: d,
        date,
        isToday: isSameDay(date, new Date()),
        isSunday: dayOfWeek === 0,
        isHoliday: !!holiday,
        holiday,
      });
    }

    return days;
  };

  const calendarDays = buildCalendar();

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

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

      {/* 🆕 TODAY HOLIDAY ALERT */}
      {todayHoliday && (
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <PartyPopper size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Holiday
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  {todayHoliday.type}
                </span>
              </div>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                🎉 {todayHoliday.name}
              </h2>

              {todayHoliday.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {todayHoliday.description}
                </p>
              )}

              <p className="mt-2 text-xs text-gray-500">
                {todayHoliday.isPaid
                  ? '💰 Paid Holiday'
                  : '⚠️ Unpaid Holiday'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 CALENDAR + UPCOMING HOLIDAYS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* CALENDAR */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Calendar
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="min-w-[120px] text-center text-sm font-semibold text-gray-900">
                {MONTHS[calMonth]} {calYear}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="p-5">
            {/* Weekday headers */}
            <div className="mb-2 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="text-center text-[10px] font-bold uppercase tracking-wide text-gray-400"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d) => {
                if (d.empty) {
                  return <div key={d.key} className="aspect-square" />;
                }

                let classes =
                  'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition';

                if (d.isHoliday) {
                  classes +=
                    ' bg-amber-100 text-amber-800 font-bold border border-amber-300';
                } else if (d.isSunday) {
                  classes +=
                    ' bg-red-50 text-red-600 font-medium border border-red-100';
                } else {
                  classes +=
                    ' bg-white text-gray-700 border border-gray-100';
                }

                if (d.isToday) {
                  classes += ' ring-2 ring-blue-500 ring-offset-1';
                }

                return (
                  <div
                    key={d.key}
                    className={classes}
                    title={
                      d.holiday
                        ? `${d.holiday.name} (${d.holiday.type})`
                        : d.isSunday
                        ? 'Sunday'
                        : ''
                    }
                  >
                    <span className="text-xs">{d.day}</span>

                    {d.isHoliday && (
                      <span className="absolute -bottom-0.5 text-[8px]">
                        🎉
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-red-50 border border-red-100" />
                <span>Sunday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded ring-2 ring-blue-500 ring-offset-1" />
                <span>Today</span>
              </div>
            </div>
          </div>
        </Card>

        {/* UPCOMING HOLIDAYS */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Upcoming Holidays
              </h2>
            </div>
          </div>

          <div className="p-5">
            {upcomingHolidays.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
                <CalendarDays
                  size={28}
                  className="mx-auto text-gray-300"
                />
                <p className="mt-2 text-xs text-gray-500">
                  No upcoming holidays
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingHolidays.map((h) => (
                  <div
                    key={h._id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <span className="text-[9px] font-bold uppercase">
                        {new Date(h.date).toLocaleString('en-IN', {
                          month: 'short',
                        })}
                      </span>
                      <span className="text-sm font-bold leading-none">
                        {new Date(h.date).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {h.name}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-wide text-gray-400">
                        {h.type}
                        {h.isPaid ? ' · Paid' : ' · Unpaid'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
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
          {/* If today holiday, show alert instead of buttons */}
          {todayHoliday ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <AlertCircle size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Today is a holiday — {todayHoliday.name}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Attendance marking is not required today.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </Card>

      {/* Face Check-In */}
      {!todayHoliday && <FaceCheckIn onSuccess={() => load()} />}

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