import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BriefcaseBusiness,
  ArrowRight,
  Calendar,
  CreditCard,
  Search,
} from 'lucide-react';

import api from '../../api/axios.js';
import Loader from '../../components/ui/Loader.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import { formatDate, formatDateTime } from '../../utils/format.js';

/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

/* =========================================================
   PAYMENTS PAGE (Client)
========================================================= */

export default function ClientPayments() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data: res } = await api.get(
          '/client-portal/projects/payments/breakdown'
        );

        setData(res?.data || null);
      } catch (err) {
        console.error('payments err:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <Loader text="Loading payments..." />;
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Wallet size={40} className="mx-auto text-gray-300" />

        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          Unable to load payments
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Please try again later.
        </p>
      </div>
    );
  }

  const summary = data.summary || {};
  const projects = data.projects || [];
  const paymentHistory = data.paymentHistory || [];

  /* =========================================================
     FILTER PROJECTS BY SEARCH
  ========================================================= */

  const filteredProjects = search.trim()
    ? projects.filter((p) =>
        (p.projectName || '')
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : projects;

  /* =========================================================
     OVERALL PROGRESS
  ========================================================= */

  const overallProgress = Math.min(
    100,
    Math.max(0, Number(summary.overallProgress || 0))
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Payments
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your payments and project-wise breakdown.
        </p>
      </div>

      {/* ========================================================
          SUMMARY CARDS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Total Amount"
          value={formatCurrency(summary.totalAmount)}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          icon={TrendingUp}
          label="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          iconClass="bg-green-50 text-green-600"
          valueClass="text-green-600"
        />

        <SummaryCard
          icon={TrendingDown}
          label="Remaining"
          value={formatCurrency(summary.remainingAmount)}
          iconClass="bg-red-50 text-red-600"
          valueClass="text-red-600"
        />

        <SummaryCard
          icon={BriefcaseBusiness}
          label="Projects"
          value={summary.totalProjects || 0}
          iconClass="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* ========================================================
          OVERALL PROGRESS BAR
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Overall Payment Progress
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {formatCurrency(summary.totalPaid)} of{' '}
              {formatCurrency(summary.totalAmount)} paid
            </p>
          </div>

          <p className="text-2xl font-bold text-blue-600">
            {overallProgress}%
          </p>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* ========================================================
          PROJECT-WISE BREAKDOWN
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Project-wise Breakdown
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Payment details for each project.
            </p>
          </div>

          {/* SEARCH */}
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-10 text-center">
            <BriefcaseBusiness
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              {projects.length === 0
                ? 'No projects yet'
                : 'No projects found'}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {projects.length === 0
                ? 'Payments will appear here once projects are assigned.'
                : 'Try a different search.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProjects.map((project) => (
              <ProjectPaymentCard
                key={project._id}
                project={project}
                onOpen={() =>
                  navigate(`/client/projects/${project._id}`)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          PAYMENT HISTORY
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            All your recent payments.
          </p>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="p-10 text-center">
            <CreditCard
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-3 text-sm font-semibold text-gray-900">
              No payments yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Your payment history will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paymentHistory.map((payment) => (
              <PaymentHistoryRow
                key={payment._id}
                payment={payment}
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

function SummaryCard({
  icon: Icon,
  label,
  value,
  iconClass,
  valueClass = 'text-gray-900',
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-bold ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROJECT PAYMENT CARD
========================================================= */

function ProjectPaymentCard({ project, onOpen }) {
  const progress = Math.min(
    100,
    Math.max(0, Number(project.paymentProgress || 0))
  );

  const isFullyPaid = progress >= 100;

  return (
    <div className="p-5 transition hover:bg-gray-50">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* LEFT — PROJECT */}
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BriefcaseBusiness size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-gray-900">
                {project.projectName}
              </h3>

              {isFullyPaid && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-600">
                  <CheckCircle2 size={11} />
                  Paid
                </span>
              )}
            </div>

            {project.technology && (
              <p className="mt-1 text-xs text-gray-500">
                {project.technology}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {project.status && (
                <Badge color={statusColor(project.status)}>
                  {project.status}
                </Badge>
              )}

              {project.priority && (
                <Badge color={statusColor(project.priority)}>
                  {project.priority}
                </Badge>
              )}

              {project.deadline && (
                <span className="text-xs text-gray-500">
                  Deadline: {formatDate(project.deadline)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE — PAYMENT NUMBERS */}
        <div className="grid grid-cols-3 gap-4 lg:w-[380px]">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Total
            </p>

            <p className="mt-0.5 text-sm font-semibold text-gray-900">
              {formatCurrency(project.totalAmount)}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Paid
            </p>

            <p className="mt-0.5 text-sm font-semibold text-green-600">
              {formatCurrency(project.paidAmount)}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400">
              Remaining
            </p>

            <p className="mt-0.5 text-sm font-semibold text-red-600">
              {formatCurrency(project.remainingAmount)}
            </p>
          </div>
        </div>

        {/* PROGRESS */}
        <div className="w-full lg:w-[180px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Payment
            </span>

            <span className="text-sm font-bold text-blue-600">
              {progress}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyPaid
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ACTION */}
        <button
          type="button"
          onClick={onOpen}
          className="
            inline-flex
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-200
            bg-white
            px-4
            py-2
            text-xs
            font-semibold
            text-gray-700
            shadow-sm
            transition
            hover:border-blue-200
            hover:bg-blue-50
            hover:text-blue-600
          "
        >
          View
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAYMENT HISTORY ROW
========================================================= */

function PaymentHistoryRow({ payment }) {
  return (
    <div className="flex flex-col gap-3 p-4 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
      {/* LEFT */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
          <CheckCircle2 size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {payment.projectName || 'Payment'}
            </p>

            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
              {payment.paymentMethod}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDateTime(payment.paymentDate)}
            </span>

            {payment.transactionId && (
              <span className="truncate">
                🆔 {payment.transactionId}
              </span>
            )}
          </div>

          {payment.notes && (
            <p className="mt-1 text-xs text-gray-500">
              {payment.notes}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT — AMOUNT */}
      <div className="shrink-0 text-right">
        <p className="text-base font-bold text-green-600">
          + {formatCurrency(payment.amount)}
        </p>
      </div>
    </div>
  );
}