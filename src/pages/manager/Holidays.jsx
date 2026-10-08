import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  PartyPopper,
  CalendarDays,
  Pencil,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
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

const HOLIDAY_TYPES = [
  'National',
  'Festival',
  'Optional',
  'Restricted',
  'Company',
];

const APPLICABLE_TO = [
  'All',
  'Manager',
  'Sales',
  'Developer',
  'Specific',
];

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

const initialForm = {
  name: '',
  description: '',
  date: '',
  endDate: '',
  type: 'Festival',
  isPaid: true,
  applicableTo: 'All',
  specificEmployees: [],
};

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
   MANAGER HOLIDAYS PAGE
========================================================= */

export default function ManagerHolidays() {
  const { success, error: toastError } = useToast();

  const now = new Date();

  const [holidays, setHolidays] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  /* Calendar */
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calHolidays, setCalHolidays] = useState([]);

  /* Employees (for specific) */
  const [employees, setEmployees] = useState([]);

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  /* =========================================================
     LOAD
  ========================================================= */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/holidays', {
        params: { page, limit: 20 },
      });

      setHolidays(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load holidays'
      );
    } finally {
      setLoading(false);
    }
  }, [page, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  /* Calendar month holidays */
  useEffect(() => {
    const loadCal = async () => {
      try {
        const { data } = await api.get('/holidays', {
          params: {
            year: calYear,
            month: calMonth + 1,
            limit: 100,
          },
        });

        setCalHolidays(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadCal();
  }, [calMonth, calYear]);

  /* Employees */
  useEffect(() => {
    api
      .get('/employees', { params: { limit: 200 } })
      .then((res) => setEmployees(res.data.data || []))
      .catch(() => {});
  }, []);

  /* =========================================================
     OPEN / CLOSE
  ========================================================= */

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (holiday) => {
    setEditing(holiday);

    setForm({
      name: holiday.name || '',
      description: holiday.description || '',
      date: holiday.date
        ? new Date(holiday.date).toISOString().slice(0, 10)
        : '',
      endDate: holiday.endDate
        ? new Date(holiday.endDate).toISOString().slice(0, 10)
        : '',
      type: holiday.type || 'Festival',
      isPaid: holiday.isPaid ?? true,
      applicableTo: holiday.applicableTo || 'All',
      specificEmployees:
        holiday.specificEmployees?.map((e) => e._id || e) || [],
    });

    setModalOpen(true);
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { ...form };

      if (!payload.endDate) delete payload.endDate;

      if (editing) {
        await api.put(`/holidays/${editing._id}`, payload);
        success('Holiday updated');
      } else {
        await api.post('/holidays', payload);
        success('Holiday added');
      }

      setModalOpen(false);
      setEditing(null);
      setForm(initialForm);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save holiday'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const remove = async (holiday) => {
    if (
      !confirm(
        `Delete holiday "${holiday.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/holidays/${holiday._id}`);
      success('Holiday deleted');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete'
      );
    }
  };

  /* =========================================================
     TOGGLE EMPLOYEE
  ========================================================= */

  const toggleEmployee = (id) => {
    setForm((f) => ({
      ...f,
      specificEmployees: f.specificEmployees.includes(id)
        ? f.specificEmployees.filter((x) => x !== id)
        : [...f.specificEmployees, id],
    }));
  };

  /* =========================================================
     CALENDAR BUILD
  ========================================================= */

  const buildCalendar = () => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ empty: true, key: `e-${i}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const dayOfWeek = date.getDay();

      const holiday = calHolidays.find((h) =>
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

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <PartyPopper size={21} />
            </div>

            <div className="min-w-0">
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Holidays
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage company holidays and calendar
              </p>
            </div>
          </div>

          <Button
            onClick={openCreate}
            className="rounded-xl bg-blue-600 font-semibold shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Calendar + Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
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
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="min-w-[120px] text-center text-sm font-semibold text-gray-900">
                {MONTHS[calMonth]} {calYear}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="p-5">
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

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((d) => {
                if (d.empty) {
                  return (
                    <div key={d.key} className="aspect-square" />
                  );
                }

                let classes =
                  'relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition cursor-pointer hover:opacity-90';

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
                    onClick={() => d.holiday && openEdit(d.holiday)}
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

        {/* Info Card */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              This Month
            </h2>
          </div>

          <div className="p-5 space-y-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                Total Holidays
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {calHolidays.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Paid Holidays
              </p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {
                  calHolidays.filter((h) => h.isPaid).length
                }
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Working Days
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {calendarDays.filter(
                  (d) => !d.empty && !d.isHoliday && !d.isSunday
                ).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Holidays List */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <PartyPopper size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">
              All Holidays
            </h2>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : holidays.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-10 text-center">
              <PartyPopper
                size={32}
                className="mx-auto text-gray-300"
              />
              <p className="mt-3 text-sm font-semibold text-gray-700">
                No holidays yet
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Add your first holiday to get started.
              </p>
              <Button
                size="sm"
                onClick={openCreate}
                className="mt-4 rounded-xl"
              >
                <Plus size={14} />
                Add Holiday
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {holidays.map((h) => (
                <div
                  key={h._id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-amber-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Left */}
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <span className="text-[9px] font-bold uppercase">
                        {new Date(h.date).toLocaleString('en-IN', {
                          month: 'short',
                        })}
                      </span>
                      <span className="text-base font-bold leading-none">
                        {new Date(h.date).getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {h.name}
                        </h3>

                        <Badge color="amber">{h.type}</Badge>

                        {h.isPaid ? (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                            Paid
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                            Unpaid
                          </span>
                        )}
                      </div>

                      {h.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                          {h.description}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-gray-500">
                        📅 {formatDate(h.date)}
                        {h.endDate && ` → ${formatDate(h.endDate)}`}
                        <span className="ml-3">
                          👥 {h.applicableTo}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(h)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(h)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
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

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Holiday' : 'Add Holiday'}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-5">
          {/* Name + Description */}
          <Input
            label="Holiday Name *"
            required
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            placeholder="e.g. Diwali"
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              placeholder="Optional description..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start Date *"
              type="date"
              required
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
            />

            <Input
              label="End Date (optional)"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm({ ...form, endDate: e.target.value })
              }
            />
          </div>

          {/* Type + Paid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
            >
              {HOLIDAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Select
              label="Applicable To"
              value={form.applicableTo}
              onChange={(e) =>
                setForm({
                  ...form,
                  applicableTo: e.target.value,
                })
              }
            >
              {APPLICABLE_TO.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>

          {/* Is Paid */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <input
              type="checkbox"
              id="isPaid"
              checked={form.isPaid}
              onChange={(e) =>
                setForm({ ...form, isPaid: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label
              htmlFor="isPaid"
              className="text-sm font-medium text-gray-700"
            >
              Paid Holiday (employees get paid leave)
            </label>
          </div>

          {/* Specific Employees */}
          {form.applicableTo === 'Specific' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Select Employees *
                </label>

                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
                  {form.specificEmployees.length} Selected
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/60 p-2">
                {employees.map((emp) => {
                  const selected =
                    form.specificEmployees.includes(emp._id);

                  return (
                    <label
                      key={emp._id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 mb-1 transition ${
                        selected
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-transparent bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleEmployee(emp._id)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {emp.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {emp.role}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
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
              className="rounded-xl bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
            >
              {editing ? 'Update Holiday' : 'Add Holiday'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}