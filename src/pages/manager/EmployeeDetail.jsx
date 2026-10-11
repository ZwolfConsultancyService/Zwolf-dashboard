import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserCircle,
  Calendar,
  BriefcaseBusiness,
  Mail,
  Phone,
  IndianRupee,
  Save,
  ChevronLeft,
  ChevronRight,
  Edit3,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

/* =========================================================
   CONSTANTS
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

const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(x.getDate()).padStart(2, '0')}`;
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
   MAIN COMPONENT
========================================================= */

export default function ManagerEmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [stats, setStats] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [salaryModal, setSalaryModal] = useState(false);
  const [salaryForm, setSalaryForm] = useState({ monthlySalary: 0 });
  const [saving, setSaving] = useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const month = calMonth + 1;

      const [detailRes, salaryRes] = await Promise.all([
        api.get(`/employees/${id}/detail`, {
          params: { month, year: calYear },
        }),
        api.get(`/employees/${id}/salary`, {
          params: { month, year: calYear },
        }),
      ]);

      setEmployee(detailRes.data.data.employee);
      setAttendance(detailRes.data.data.attendance || []);
      setLeaves(detailRes.data.data.leaves || []);
      setHolidays(detailRes.data.data.holidays || []);
      setStats(detailRes.data.data.stats || null);
      setSalary(salaryRes.data.data || null);

      setSalaryForm({
        monthlySalary:
          detailRes.data.data.employee?.monthlySalary || 0,
      });
    } catch (err) {
      console.error(err);
      toastError('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  }, [id, calMonth, calYear, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     SAVE SALARY
  ========================================================= */

  const saveSalary = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/employees/${id}/salary`, {
        monthlySalary: Number(salaryForm.monthlySalary),
      });
      success('Salary updated');
      setSalaryModal(false);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save salary'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CALENDAR BUILD
  ========================================================= */

  const attendanceMap = {};
  attendance.forEach((a) => {
    attendanceMap[dateKey(a.date)] = a;
  });

  const leaveMap = {};
  leaves.forEach((leave) => {
    const from = new Date(leave.fromDate);
    const to = new Date(leave.toDate);
    const current = new Date(from);
    while (current <= to) {
      leaveMap[dateKey(current)] = leave;
      current.setDate(current.getDate() + 1);
    }
  });

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
      const key = dateKey(date);

      const holiday = holidays.find((h) => isSameDay(h.date, date));
      const att = attendanceMap[key];
      const leave = leaveMap[key];

      let status = null;
      if (holiday) status = 'Holiday';
      else if (att?.status) status = att.status;
      else if (leave) status = 'Leave';
      else if (dayOfWeek === 0) status = 'Weekend';

      days.push({
        key: `d-${d}`,
        day: d,
        date,
        isToday: isSameDay(date, new Date()),
        isSunday: dayOfWeek === 0,
        isHoliday: !!holiday,
        holiday,
        attendance: att,
        leave,
        status,
      });
    }

    return days;
  };

  const calendarDays = buildCalendar();

  const getDayStyles = (d) => {
    const s = d.status;

    if (s === 'Absent') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (s === 'Present') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'Half Day') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (s === 'Leave') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (s === 'Holiday') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'Weekend') {
      return 'bg-slate-50 text-slate-400 border-slate-200';
    }
    return 'bg-white text-slate-600 border-slate-200';
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading || !employee) {
    return <Loader text="Loading employee..." />;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-5 pb-8">
      {/* BACK */}
      <button
        type="button"
        onClick={() => navigate('/manager/employees')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </button>

      {/* =====================================================
          EMPLOYEE HEADER
      ===================================================== */}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <UserCircle size={32} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color="blue">{employee.role}</Badge>
                  {employee.isActive ? (
                    <Badge color="green">Active</Badge>
                  ) : (
                    <Badge color="red">Inactive</Badge>
                  )}
                </div>

                <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                  {employee.name}
                </h1>

                {employee.designation && (
                  <p className="mt-1 text-sm text-slate-600">
                    {employee.designation}
                    {employee.department && ` · ${employee.department}`}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>{employee.email || '—'}</span>
                  </div>

                  {employee.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>{employee.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <BriefcaseBusiness
                      size={13}
                      className="text-slate-400"
                    />
                    <span>
                      Joined{' '}
                      {employee.joiningDate
                        ? formatDate(employee.joiningDate)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {employee.monthlySalary > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Monthly Salary
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">
                    ₹{employee.monthlySalary.toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSalaryModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Edit3 size={15} />
                {employee.monthlySalary > 0
                  ? 'Update Salary'
                  : 'Set Salary'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MONTH SELECTOR
      ===================================================== */}

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <button
          onClick={() => {
            if (calMonth === 0) {
              setCalMonth(11);
              setCalYear((y) => y - 1);
            } else {
              setCalMonth((m) => m - 1);
            }
          }}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ChevronLeft size={15} />
          Prev
        </button>

        <h2 className="text-base font-semibold text-slate-900">
          {MONTHS[calMonth]} {calYear}
        </h2>

        <button
          onClick={() => {
            if (calMonth === 11) {
              setCalMonth(0);
              setCalYear((y) => y + 1);
            } else {
              setCalMonth((m) => m + 1);
            }
          }}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Next
          <ChevronRight size={15} />
        </button>
      </div>

      {/* =====================================================
          CALENDAR
      ===================================================== */}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              Attendance — {MONTHS[calMonth]} {calYear}
            </h2>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((d) => {
              if (d.empty) {
                return <div key={d.key} className="h-20" />;
              }

              return (
                <div
                  key={d.key}
                  className={`
                    relative flex h-20 flex-col items-center justify-center gap-0.5 px-1
                    rounded-md border text-center transition
                    ${getDayStyles(d)}
                    ${d.isToday ? 'ring-1 ring-blue-500' : ''}
                  `}
                  title={d.status || ''}
                >
                  <span className="text-base font-semibold leading-none">
                    {d.day}
                  </span>

                  {d.status && (
                    <span className="text-[10px] font-medium leading-tight">
                      {d.status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================
          💰 SALARY — SIMPLE VERSION
      ===================================================== */}

      {salary && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <IndianRupee size={15} className="text-slate-500" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Salary — {MONTHS[calMonth]} {calYear}
                </h2>
              </div>
            </div>

            <button
              onClick={() => setSalaryModal(true)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Edit Salary
            </button>
          </div>

          <div className="space-y-4 p-5">
            {/* TOP 3 BOXES */}
            <div className="grid grid-cols-3 gap-3">
              <Box
                label="Monthly Salary"
                value={`₹${salary.monthlySalary.toLocaleString(
                  'en-IN'
                )}`}
              />
              <Box
                label="Working Days"
                value={salary.workingDays}
              />
              <Box
                label="Per Day"
                value={`₹${salary.perDaySalary.toLocaleString(
                  'en-IN'
                )}`}
              />
            </div>

            {/* PAISA MILEGA */}
            <div className="rounded-md border border-emerald-200">
              <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  💰 Paisa Milega
                </p>
              </div>

              <div className="divide-y divide-emerald-50">
                {salary.stats.present > 0 && (
                  <SimpleRow
                    label={`Present (${salary.stats.present} days)`}
                    value={`+ ₹${(
                      salary.stats.present *
                      salary.perDaySalary
                    ).toLocaleString('en-IN')}`}
                    color="emerald"
                  />
                )}

                {salary.stats.halfDay > 0 && (
                  <SimpleRow
                    label={`Half Day (${salary.stats.halfDay} × 0.5)`}
                    value={`+ ₹${Math.round(
                      salary.stats.halfDay *
                        0.5 *
                        salary.perDaySalary
                    ).toLocaleString('en-IN')}`}
                    color="emerald"
                  />
                )}

                {salary.stats.leavePaid > 0 && (
                  <SimpleRow
                    label={`Paid Leave (${salary.stats.leavePaid} days)`}
                    value={`+ ₹${(
                      salary.stats.leavePaid *
                      salary.perDaySalary
                    ).toLocaleString('en-IN')}`}
                    color="emerald"
                  />
                )}

                <div className="flex items-center justify-between bg-emerald-50/60 px-4 py-3">
                  <span className="text-sm font-bold text-slate-800">
                    Total ({salary.effectiveDays} days)
                  </span>
                  <span className="text-base font-bold text-emerald-700">
                    ₹
                    {salary.finalSalary.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* PAISA KATEGA */}
            {salary.deductions > 0 && (
              <div className="rounded-md border border-red-200">
                <div className="border-b border-red-100 bg-red-50 px-4 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                    ❌ Paisa Katega
                  </p>
                </div>

                <div className="divide-y divide-red-50">
                  {salary.stats.absent > 0 && (
                    <SimpleRow
                      label={`Absent (${salary.stats.absent} days)`}
                      value={`− ₹${(
                        salary.stats.absent *
                        salary.perDaySalary
                      ).toLocaleString('en-IN')}`}
                      color="red"
                    />
                  )}

                  {salary.stats.halfDay > 0 && (
                    <SimpleRow
                      label={`Half Day Cut (${salary.stats.halfDay} × 0.5)`}
                      value={`− ₹${Math.round(
                        salary.stats.halfDay *
                          0.5 *
                          salary.perDaySalary
                      ).toLocaleString('en-IN')}`}
                      color="red"
                    />
                  )}

                  {salary.stats.leaveUnpaid > 0 && (
                    <SimpleRow
                      label={`Unpaid Leave (${salary.stats.leaveUnpaid} days)`}
                      value={`− ₹${(
                        salary.stats.leaveUnpaid *
                        salary.perDaySalary
                      ).toLocaleString('en-IN')}`}
                      color="red"
                    />
                  )}

                  <div className="flex items-center justify-between bg-red-50/60 px-4 py-3">
                    <span className="text-sm font-bold text-slate-800">
                      Total Cut
                    </span>
                    <span className="text-base font-bold text-red-600">
                      − ₹
                      {salary.deductions.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* NO EFFECT */}
            {(salary.stats.holiday > 0 ||
              salary.stats.weekend > 0) && (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] text-slate-600">
                  <strong>⚪ No Effect:</strong>{' '}
                  {salary.stats.holiday > 0 && (
                    <span>
                      Holiday {salary.stats.holiday} days
                    </span>
                  )}
                  {salary.stats.holiday > 0 &&
                    salary.stats.weekend > 0 &&
                    ' · '}
                  {salary.stats.weekend > 0 && (
                    <span>
                      Weekend {salary.stats.weekend} days
                    </span>
                  )}{' '}
                  — paisa nahi katega
                </p>
              </div>
            )}

            {/* FINAL */}
            <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    🎯 Final Salary
                  </p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700">
                    ₹
                    {salary.finalSalary.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600">
                    {salary.effectiveDays} days × ₹
                    {salary.perDaySalary}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                    Deducted
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    − ₹
                    {salary.deductions.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SALARY MODAL
      ===================================================== */}

      <Modal
        open={salaryModal}
        onClose={() => setSalaryModal(false)}
        title="Set Monthly Salary"
      >
        <form onSubmit={saveSalary} className="space-y-5">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
            <p className="text-sm font-semibold text-slate-900">
              {employee.name}
            </p>
            <p className="text-xs text-slate-500">
              {employee.role} ·{' '}
              {employee.designation || 'Employee'}
            </p>
          </div>

          <Input
            label="Monthly Salary (₹)"
            type="number"
            min="0"
            value={salaryForm.monthlySalary}
            onChange={(e) =>
              setSalaryForm({
                monthlySalary: e.target.value,
              })
            }
            required
          />

          <p className="rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            💡 Per day salary will be calculated based on the working
            days of each month.
          </p>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSalaryModal(false)}
              disabled={saving}
              className="rounded-md px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-md bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
            >
              <Save size={14} />
              Save Salary
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function Box({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SimpleRow({ label, value, color = 'slate' }) {
  const colorClass = {
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    slate: 'text-slate-500',
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={`text-sm font-bold ${colorClass[color]}`}
      >
        {value}
      </span>
    </div>
  );
}