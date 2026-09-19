import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  ListTodo,
  ArrowRight,
  FileText,
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

        {/* Card Header */}
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


        {/* Form */}
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

                {/* Label */}
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


                {/* Textarea */}
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


          {/* Submit Area */}
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

        {/* History Header */}
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


        {/* History Content */}
        <div className="p-5">

          {records.length === 0 ? (

            <EmptyState
              title="No history yet"
            />

          ) : (

            <div className="space-y-3">

              {records.slice(0, 10).map((r) => (

                <div
                  key={r._id}
                  className="
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    p-4
                    transition-all
                    duration-200
                    hover:border-blue-200
                    hover:shadow-sm
                  "
                >

                  <div className="
                    flex
                    flex-col
                    gap-3
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                  ">

                    {/* Date */}
                    <div className="flex items-center gap-3">

                      <div className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-blue-50
                        text-blue-600
                      ">
                        <CalendarDays size={17} />
                      </div>

                      <div>
                        <p className="
                          text-sm
                          font-semibold
                          text-gray-900
                        ">
                          {formatDate(r.date)}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          Daily work report
                        </p>
                      </div>

                    </div>

                  </div>


                  {/* Completed Work */}
                  <div className="
                    mt-4
                    rounded-lg
                    border
                    border-gray-100
                    bg-gray-50/70
                    p-3
                  ">

                    <div className="flex items-center gap-2">

                      <CheckCircle2
                        size={15}
                        className="text-green-600"
                      />

                      <span className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-500
                      ">
                        Completed
                      </span>

                    </div>

                    <p className="
                      mt-2
                      whitespace-pre-wrap
                      text-sm
                      leading-6
                      text-gray-700
                    ">
                      {r.completedWork || '—'}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </Card>

    </div>
  );
}
