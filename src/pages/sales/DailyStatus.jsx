import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ListTodo,
  ArrowRight,
  FileText,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { formatDate } from '../../utils/format.js';

export default function SalesDailyStatus() {
  const { success, error: toastError } = useToast();

  const [records, setRecords] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    completedWork: '',
    workInProgress: '',
    pendingWork: '',
    blockers: '',
    nextPlan: '',
  });

  const load = async () => {
    const { data } = await api.get('/daily-status/my', {
      params: { limit: 30 },
    });

    setRecords(data.data);

    const today = new Date().toISOString().slice(0, 10);

    const todayRec = data.data.find(
      (r) => r.date.slice(0, 10) === today
    );

    if (todayRec) {
      setForm({
        completedWork: todayRec.completedWork || '',
        workInProgress: todayRec.workInProgress || '',
        pendingWork: todayRec.pendingWork || '',
        blockers: todayRec.blockers || '',
        nextPlan: todayRec.nextPlan || '',
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/daily-status', form);

      success('Status submitted');

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     🆕 DELETE REPORT
  ========================================================= */

  const removeReport = async (record) => {
    if (
      !confirm(
        `Delete your daily status report for ${formatDate(
          record.date
        )}?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/daily-status/${record._id}`);
      success('Report deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          'Failed to delete report'
      );
    }
  };

  /* =========================================================
     🆕 EDIT REPORT (load into form)
  ========================================================= */

  const editReport = (record) => {
    setForm({
      completedWork: record.completedWork || '',
      workInProgress: record.workInProgress || '',
      pendingWork: record.pendingWork || '',
      blockers: record.blockers || '',
      nextPlan: record.nextPlan || '',
    });

    /* Scroll to top */
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* =========================================================
     🆕 TOGGLE EXPAND
  ========================================================= */

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const today = new Date().toISOString().slice(0, 10);

  const fields = [
    {
      key: 'completedWork',
      label: 'Completed Work',
      description: 'What did you complete today?',
      icon: CheckCircle2,
      iconClass: 'bg-green-50 text-green-600',
      placeholder:
        'Example: Completed client dashboard, fixed login issue...',
    },
    {
      key: 'workInProgress',
      label: 'Work In Progress',
      description: 'What are you currently working on?',
      icon: Clock3,
      iconClass: 'bg-blue-50 text-blue-600',
      placeholder:
        'Example: Working on project management module...',
    },
    {
      key: 'pendingWork',
      label: 'Pending Work',
      description: 'What work is still pending?',
      icon: ListTodo,
      iconClass: 'bg-amber-50 text-amber-600',
      placeholder:
        'Example: Payment integration and testing are pending...',
    },
    {
      key: 'blockers',
      label: 'Blockers',
      description: 'Mention any issue blocking your work.',
      icon: AlertTriangle,
      iconClass: 'bg-red-50 text-red-600',
      placeholder:
        'Example: Waiting for API credentials from client...',
    },
    {
      key: 'nextPlan',
      label: 'Next Plan',
      description: 'What do you plan to work on next?',
      icon: ArrowRight,
      iconClass: 'bg-indigo-50 text-indigo-600',
      placeholder:
        'Example: Complete payment module and deploy...',
    },
  ];

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
      ">
        <div className="flex items-center gap-3">

          <div className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-50
            text-blue-600
          ">
            <FileText size={21} />
          </div>

          <div>
            <h1 className="
              text-xl
              font-bold
              tracking-tight
              text-gray-900
              sm:text-2xl
            ">
              Daily Status
            </h1>

            <p className="mt-0.5 text-sm text-gray-500">
              Submit your daily work update and track your previous reports.
            </p>
          </div>

        </div>
      </div>


      {/* =====================================================
          TODAY'S REPORT
      ===================================================== */}
      <Card>

        <div className="
          border-b
          border-gray-100
          px-5
          py-4
        ">
          <div className="flex items-center gap-3">

            <div className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-blue-50
              text-blue-600
            ">
              <CalendarDays size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Today's Report
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Share your work progress for today.
              </p>
            </div>

          </div>
        </div>


        <form
          onSubmit={submit}
          className="space-y-5 p-5"
        >

          {fields.map((field) => {
            const Icon = field.icon;

            return (
              <div
                key={field.key}
                className="
                  rounded-xl
                  border
                  border-gray-200
                  bg-white
                  p-4
                  transition-all
                  duration-200
                  hover:border-gray-300
                "
              >

                <div className="mb-3 flex items-start gap-3">

                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${field.iconClass}
                    `}
                  >
                    <Icon size={17} />
                  </div>

                  <div>
                    <label
                      htmlFor={field.key}
                      className="
                        block
                        text-sm
                        font-semibold
                        text-gray-800
                      "
                    >
                      {field.label}
                    </label>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {field.description}
                    </p>
                  </div>

                </div>


                <textarea
                  id={field.key}
                  rows={3}
                  value={form[field.key]}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [field.key]: e.target.value,
                    })
                  }
                  className="
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    px-4
                    py-3
                    text-sm
                    leading-6
                    text-gray-800
                    outline-none
                    transition-all
                    duration-200
                    placeholder:text-gray-400
                    hover:border-gray-300
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                />

              </div>
            );
          })}


          <div className="
            flex
            flex-col
            gap-3
            border-t
            border-gray-100
            pt-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <div className="text-xs text-gray-500">
              Make sure your daily work details are updated before submitting.
            </div>

            <Button
              type="submit"
              loading={saving}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-[0_4px_12px_rgba(37,99,235,0.18)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-blue-700
                hover:shadow-[0_6px_18px_rgba(37,99,235,0.25)]
                focus:outline-none
                focus:ring-4
                focus:ring-blue-500/20
              "
            >
              Submit Today's Status
            </Button>

          </div>

        </form>

      </Card>


      {/* =====================================================
          HISTORY
      ===================================================== */}
      <Card>

        <div className="
          border-b
          border-gray-100
          px-5
          py-4
        ">
          <div className="flex items-center justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-gray-100
                text-gray-600
              ">
                <CalendarDays size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Status History
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Your recent daily status reports.
                </p>
              </div>

            </div>

            {records.length > 0 && (
              <span className="
                rounded-full
                bg-gray-100
                px-2.5
                py-1
                text-xs
                font-semibold
                text-gray-600
              ">
                {records.length} Reports
              </span>
            )}

          </div>
        </div>


        <div className="p-5">

          {records.length === 0 ? (

            <EmptyState
              title="No history yet"
            />

          ) : (

            <div className="space-y-3">

              {records.slice(0, 15).map((r) => {
                const isToday = r.date.slice(0, 10) === today;
                const isExpanded = expandedId === r._id;

                return (
                  <div
                    key={r._id}
                    className={`
                      rounded-xl
                      border
                      bg-white
                      transition-all
                      duration-200
                      ${
                        isToday
                          ? 'border-blue-300 bg-blue-50/30'
                          : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
                      }
                    `}
                  >

                    {/* =========================================
                        HEADER — Clickable
                    ========================================= */}
                    <div
                      onClick={() => toggleExpand(r._id)}
                      className="
                        flex
                        cursor-pointer
                        flex-col
                        gap-3
                        p-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >

                      <div className="flex items-center gap-3">

                        <div
                          className={`
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            ${
                              isToday
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-600'
                            }
                          `}
                        >
                          <CalendarDays size={17} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="
                              text-sm
                              font-semibold
                              text-gray-900
                            ">
                              {formatDate(r.date)}
                            </p>

                            {isToday && (
                              <span className="
                                rounded-full
                                bg-blue-600
                                px-2
                                py-0.5
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-wide
                                text-white
                              ">
                                Today
                              </span>
                            )}

                            <span
                              className={`
                                rounded-full
                                px-2
                                py-0.5
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-wide
                                ${
                                  r.status === 'Reviewed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }
                              `}
                            >
                              {r.status || 'Submitted'}
                            </span>
                          </div>

                          <p className="mt-0.5 text-xs text-gray-400">
                            Click to {isExpanded ? 'collapse' : 'view'} full report
                          </p>
                        </div>

                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2">

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            editReport(r);
                          }}
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-blue-200
                            bg-blue-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-blue-600
                            transition
                            hover:border-blue-300
                            hover:bg-blue-100
                          "
                          title="Edit this report"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeReport(r);
                          }}
                          className="
                            inline-flex
                            items-center
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
                            transition
                            hover:border-red-300
                            hover:bg-red-100
                          "
                          title="Delete this report"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>

                        {/* Expand Icon */}
                        <div className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          text-gray-400
                        ">
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </div>

                      </div>

                    </div>

                    {/* =========================================
                        EXPANDED — Full Details
                    ========================================= */}
                    {isExpanded && (
                      <div className="
                        border-t
                        border-gray-100
                        bg-gray-50/50
                        p-4
                      ">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                          <ReportSection
                            title="Completed"
                            text={r.completedWork}
                            icon={CheckCircle2}
                            iconClass="bg-green-50 text-green-600"
                          />

                          <ReportSection
                            title="In Progress"
                            text={r.workInProgress}
                            icon={Clock3}
                            iconClass="bg-blue-50 text-blue-600"
                          />

                          <ReportSection
                            title="Pending"
                            text={r.pendingWork}
                            icon={ListTodo}
                            iconClass="bg-amber-50 text-amber-600"
                          />

                          <ReportSection
                            title="Blockers"
                            text={r.blockers}
                            icon={AlertTriangle}
                            iconClass="bg-red-50 text-red-600"
                          />

                          <ReportSection
                            title="Next Plan"
                            text={r.nextPlan}
                            icon={ArrowRight}
                            iconClass="bg-indigo-50 text-indigo-600"
                            full
                          />

                        </div>
                      </div>
                    )}

                  </div>
                );
              })}

            </div>

          )}

        </div>

      </Card>

    </div>
  );
}

/* =========================================================
   REPORT SECTION (used in expanded view)
========================================================= */

function ReportSection({
  title,
  text,
  icon: Icon,
  iconClass,
  full = false,
}) {
  return (
    <div
      className={`
        rounded-lg
        border
        border-gray-200
        bg-white
        p-3
        ${full ? 'md:col-span-2' : ''}
      `}
    >
      <div className="flex items-center gap-2">

        <div
          className={`
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-lg
            ${iconClass}
          `}
        >
          <Icon size={14} />
        </div>

        <span className="
          text-xs
          font-semibold
          uppercase
          tracking-wide
          text-gray-500
        ">
          {title}
        </span>

      </div>

      <p className="
        mt-2
        whitespace-pre-wrap
        text-sm
        leading-6
        text-gray-700
      ">
        {text || '—'}
      </p>
    </div>
  );
}