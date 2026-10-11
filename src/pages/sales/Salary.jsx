import { useEffect, useState } from 'react';
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

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

export default function SalesSalary() {
  const { error: toastError } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(
        '/attendance/my-salary-history',
        { params: { year } }
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
      toastError('Failed to load salary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year]);

  if (loading || !data) {
    return <Loader text="Loading salary..." />;
  }

  const { employee, ytd, months } = data;

  /* Year options */
  const currentYear = now.getFullYear();
  const joinYear = employee?.joiningDate
    ? new Date(employee.joiningDate).getFullYear()
    : currentYear;

  const yearOptions = [];
  for (let y = currentYear; y >= joinYear; y--) {
    yearOptions.push(y);
  }

  return (
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <IndianRupee size={21} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              My Salary
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {employee.joiningDate
                ? `Since ${formatDate(employee.joiningDate)}`
                : 'Salary details'}
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* YTD SUMMARY */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={TrendingUp}
          label="Total Earned"
          value={`₹${ytd.totalEarned.toLocaleString('en-IN')}`}
          color="emerald"
        />
        <SummaryCard
          icon={TrendingDown}
          label="Total Deducted"
          value={`− ₹${ytd.totalDeducted.toLocaleString('en-IN')}`}
          color="red"
        />
        <SummaryCard
          icon={Wallet}
          label="Net Salary"
          value={`₹${ytd.totalNetSalary.toLocaleString('en-IN')}`}
          color="blue"
        />
      </div>

      {/* MONTHLY SALARY */}
      <div className="rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Monthly Salary
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              ₹{employee.monthlySalary.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Months Worked
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {ytd.monthsWorked}
            </p>
          </div>
        </div>
      </div>

      {/* MONTH-WISE LIST */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Month-wise Breakdown
        </h2>

        {months.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Calendar size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              No salary data yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {employee.joiningDate
                ? 'Salary will appear after joining date'
                : 'Data will appear soon'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {months.map((m) => (
              <MonthCard
                key={m.month}
                month={m}
                expanded={expandedMonth === m.month}
                onToggle={() =>
                  setExpandedMonth(
                    expandedMonth === m.month ? null : m.month
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({ icon: Icon, label, value, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  };

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${colors[color]}`}
    >
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
          <p
            className={`mt-0.5 text-lg font-bold ${
              colors[color].split(' ')[1]
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MONTH CARD
========================================================= */

function MonthCard({ month, expanded, onToggle }) {
  const { stats } = month;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <span className="text-[9px] font-bold uppercase">
              {month.monthName.slice(0, 3)}
            </span>
            <span className="text-sm font-bold leading-none">
              {month.year}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {month.monthName} {month.year}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-500" />
                {stats.present} Present
              </span>
              <span className="flex items-center gap-1">
                <XCircle size={11} className="text-red-500" />
                {stats.absent} Absent
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-amber-500" />
                {stats.halfDay} Half
              </span>
              {stats.leavePaid > 0 && (
                <span className="flex items-center gap-1">
                  <Coffee size={11} className="text-orange-500" />
                  {stats.leavePaid} Leave
                </span>
              )}
            </div>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Net Salary
            </p>
            <p className="text-base font-bold text-emerald-600">
              ₹{month.finalSalary.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="shrink-0 text-slate-400">
            {expanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </div>
      </button>

      {/* EXPANDED */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          {/* Summary Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SmallBox
              label="Working Days"
              value={month.workingDays}
            />
            <SmallBox
              label="Per Day"
              value={`₹${month.perDaySalary.toLocaleString('en-IN')}`}
            />
            <SmallBox
              label="Effective Days"
              value={month.effectiveDays}
            />
            <SmallBox
              label="Net Salary"
              value={`₹${month.finalSalary.toLocaleString('en-IN')}`}
              highlight
            />
          </div>

          {/* Breakdown */}
          <div className="mt-3 rounded-md border border-slate-200 bg-white">
            <div className="grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <div className="col-span-5">Status</div>
              <div className="col-span-2 text-center">Days</div>
              <div className="col-span-2 text-center">Effect</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            <div className="divide-y divide-slate-100">
              <BreakdownRow
                label="Present"
                days={stats.present}
                effect="paid"
                amount={stats.present * month.perDaySalary}
              />
              <BreakdownRow
                label="Half Day"
                days={stats.halfDay}
                effect="half"
                amount={
                  stats.halfDay * 0.5 * month.perDaySalary
                }
              />
              <BreakdownRow
                label="Paid Leave"
                days={stats.leavePaid}
                effect="paid"
                amount={stats.leavePaid * month.perDaySalary}
              />
              <BreakdownRow
                label="Absent"
                days={stats.absent}
                effect="cut"
                amount={stats.absent * month.perDaySalary}
              />
              <BreakdownRow
                label="Unpaid Leave"
                days={stats.leaveUnpaid}
                effect="cut"
                amount={
                  stats.leaveUnpaid * month.perDaySalary
                }
              />
            </div>

            {/* Final */}
            <div className="border-t border-slate-200 bg-emerald-50 px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Net Salary
                </span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{month.finalSalary.toLocaleString('en-IN')}
                </span>
              </div>
              {month.deducted > 0 && (
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-red-600">
                    Deducted
                  </span>
                  <span className="font-semibold text-red-600">
                    − ₹{month.deducted.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function SmallBox({ label, value, highlight }) {
  return (
    <div
      className={`rounded-md border p-3 ${
        highlight
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          highlight ? 'text-emerald-600' : 'text-slate-500'
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-bold ${
          highlight ? 'text-emerald-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function BreakdownRow({ label, days, effect, amount }) {
  if (days === 0) return null;

  const effects = {
    paid: {
      label: 'PAID',
      color: 'bg-emerald-100 text-emerald-600',
      amountColor: 'text-emerald-600',
      prefix: '+',
    },
    half: {
      label: 'HALF',
      color: 'bg-amber-100 text-amber-700',
      amountColor: 'text-amber-600',
      prefix: '+',
    },
    cut: {
      label: 'CUT',
      color: 'bg-red-100 text-red-600',
      amountColor: 'text-red-600',
      prefix: '−',
    },
  };

  const e = effects[effect];

  return (
    <div className="grid grid-cols-12 items-center gap-2 px-3 py-2">
      <div className="col-span-5 text-sm text-slate-700">
        {label}
      </div>
      <div className="col-span-2 text-center text-sm font-semibold text-slate-900">
        {days}
      </div>
      <div className="col-span-2 text-center">
        <span
          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${e.color}`}
        >
          {e.label}
        </span>
      </div>
      <div
        className={`col-span-3 text-right text-sm font-semibold ${e.amountColor}`}
      >
        {e.prefix} ₹{Math.round(amount).toLocaleString('en-IN')}
      </div>
    </div>
  );
}