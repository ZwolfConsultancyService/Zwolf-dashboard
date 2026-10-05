import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Wallet,
  ArrowRight,
  CalendarDays,
  BriefcaseBusiness,
  CircleDollarSign,
  Plus,
  Search,
  X,
  Loader2,
   Video,      
  MapPin, 
} from 'lucide-react';

import api from '../../api/axios.js';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [projectSummary, setProjectSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     REQUEST MODALS STATE
  ========================================================= */

  const [activeModal, setActiveModal] = useState(null);
  // null | 'project' | 'seo'

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          dashboardResponse,
          projectSummaryResponse,
          projectsResponse,
        ] = await Promise.all([
          api.get('/client-auth/dashboard'),
          api.get('/client-portal/projects/summary'),
          api.get('/client-portal/projects', {
            params: {
              page: 1,
              limit: 10,
            },
          }),
        ]);

        setDashboard(dashboardResponse.data?.data || null);

        setProjectSummary(
          projectSummaryResponse.data?.data || {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            cancelledProjects: 0,
            averageProgress: 0,
            currentProject: null,
          }
        );

        const projectData = projectsResponse.data?.data;

        if (Array.isArray(projectData)) {
          setProjects(projectData);
        } else if (Array.isArray(projectData?.data)) {
          setProjects(projectData.data);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error(
          'CLIENT DASHBOARD ERROR:',
          error.response?.data || error.message
        );

        setDashboard(null);

        setProjectSummary({
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          cancelledProjects: 0,
          averageProgress: 0,
          currentProject: null,
        });

        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  const financials = dashboard?.financials || {};

  const projectSummaryData = projectSummary || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    cancelledProjects: 0,
    averageProgress: 0,
    currentProject: null,
  };

  const activeProjects = projects.filter(
    (project) =>
      !['Completed', 'Cancelled'].includes(project.status)
  );

  return (
    <div className="space-y-6">
      {/* ========================================================
          HEADER
      ======================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here is an overview of your account.
        </p>
      </div>

      {/* ========================================================
          ⭐ NEW REQUEST BUTTONS (PROJECT + SEO)
      ======================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* NEW PROJECT REQUEST */}
        <button
          type="button"
          onClick={() => setActiveModal('project')}
          className="
            group
            flex
            items-center
            gap-4
            rounded-xl
            border
            border-blue-100
            bg-gradient-to-br
            from-blue-50
            to-white
            p-5
            text-left
            shadow-sm
            transition
            hover:border-blue-300
            hover:shadow-md
          "
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
            <Plus size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900">
              New Project Request
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Submit a new project idea to our team.
            </p>
          </div>

          <ArrowRight
            size={18}
            className="text-blue-500 transition group-hover:translate-x-1"
          />
        </button>

        {/* SEO PLAN REQUEST */}
        <button
          type="button"
          onClick={() => setActiveModal('seo')}
          className="
            group
            flex
            items-center
            gap-4
            rounded-xl
            border
            border-emerald-100
            bg-gradient-to-br
            from-emerald-50
            to-white
            p-5
            text-left
            shadow-sm
            transition
            hover:border-emerald-300
            hover:shadow-md
          "
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
            <Search size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-gray-900">
              SEO Plan Request
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Get a custom SEO plan for your website.
            </p>
          </div>

          <ArrowRight
            size={18}
            className="text-emerald-500 transition group-hover:translate-x-1"
          />
        </button>

        {/* 🆕 MEETING REQUEST */}
  <button
    type="button"
    onClick={() => setActiveModal('meeting')}
    className="
      group
      flex
      items-center
      gap-4
      rounded-xl
      border
      border-purple-100
      bg-gradient-to-br
      from-purple-50
      to-white
      p-5
      text-left
      shadow-sm
      transition
      hover:border-purple-300
      hover:shadow-md
    "
  >
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow">
      <Video size={22} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-base font-semibold text-gray-900">
        Meeting Request
      </p>

      <p className="mt-1 text-sm text-gray-500">
        Schedule an online or offline meeting.
      </p>
    </div>

    <ArrowRight
      size={18}
      className="text-purple-500 transition group-hover:translate-x-1"
    />
  </button>
      </div>

      {/* ========================================================
          PROJECT / FINANCIAL CARDS
      ======================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          icon={FolderKanban}
          label="Total Projects"
          value={projectSummaryData.totalProjects}
          iconClass="bg-blue-50 text-blue-600"
        />

        <DashboardCard
          icon={BriefcaseBusiness}
          label="Active Projects"
          value={projectSummaryData.activeProjects}
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <DashboardCard
          icon={Wallet}
          label="Total Amount"
          value={formatCurrency(financials.totalAmount)}
          iconClass="bg-green-50 text-green-600"
        />

        <DashboardCard
          icon={CircleDollarSign}
          label="Remaining Amount"
          value={formatCurrency(financials.remainingAmount)}
          valueClass="text-red-600"
          iconClass="bg-red-50 text-red-600"
        />
      </div>

      {/* ========================================================
          PAYMENT SUMMARY
      ======================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Paid</p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(financials.totalPaid)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Average Project Progress
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {projectSummaryData.averageProgress}%
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    Number(projectSummaryData.averageProgress || 0)
                  )
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          ACTIVE PROJECTS
      ======================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Active Projects
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Projects currently assigned to your account.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            {projectSummaryData.activeProjects}
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {activeProjects.length === 0 ? (
            <div className="p-10 text-center">
              <FolderKanban
                size={40}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-3 text-sm font-semibold text-gray-900">
                No active projects
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Active projects assigned to your account will
                appear here.
              </p>
            </div>
          ) : (
            activeProjects.map((project) => {
              const progress = Math.min(
                100,
                Math.max(0, Number(project.progress || 0))
              );

              return (
                <div
                  key={project._id}
                  className="p-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <BriefcaseBusiness size={19} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {project.projectName}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {project.client?.companyName ||
                              project.client?.clientName ||
                              'Project'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge color={statusColor(project.status)}>
                          {project.status}
                        </Badge>

                        <Badge color={statusColor(project.priority)}>
                          {project.priority}
                        </Badge>

                        {project.technology && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            {project.technology}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full lg:w-[260px]">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Progress
                        </span>

                        <span className="text-sm font-bold text-blue-600">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:w-[150px]">
                      <CalendarDays
                        size={16}
                        className="text-gray-400"
                      />

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">
                          Deadline
                        </p>

                        <p className="text-sm font-medium text-gray-700">
                          {formatDate(project.deadline)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/client/projects/${project._id}`)
                      }
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
                      View Project
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          MODALS
      ======================================================== */}

      {activeModal === 'project' && (
        <ProjectRequestModal
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'seo' && (
        <SeoRequestModal
          onClose={() => setActiveModal(null)}
        />
      )}
      {/* 🆕 MEETING MODAL */}
{activeModal === 'meeting' && (
  <MeetingRequestModal onClose={() => setActiveModal(null)} />
)}
    </div>
  );
}

/* ============================================================
   DASHBOARD CARD
============================================================ */

function DashboardCard({
  icon: Icon,
  label,
  value,
  iconClass,
  valueClass = 'text-gray-900',
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PROJECT REQUEST MODAL
============================================================ */

function ProjectRequestModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Project title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/client-requests/send', {
        type: 'project',
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim(),
      });

      alert('✅ Project request sent to your Sales person!');
      onClose();
    } catch (err) {
      console.error('project request err:', err);
      setError(
        err.response?.data?.message ||
          'Failed to send request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="New Project Request"
      subtitle="Submit your project idea to our team."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Project Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. E-commerce Website"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={submitting}
          />
        </Field>

        <Field label="Description" required>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain your project requirements..."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={submitting}
          />
        </Field>

        <Field label="Budget (Optional)">
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. ₹50,000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={submitting}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <ModalActions
          submitting={submitting}
          onClose={onClose}
          submitLabel="Send Request"
        />
      </form>
    </ModalShell>
  );
}

/* ============================================================
   SEO REQUEST MODAL
============================================================ */

function SeoRequestModal({ onClose }) {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!websiteUrl.trim()) {
      setError('Website URL is required');
      return;
    }

    if (!title.trim()) {
      setError('Plan title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/client-requests/send', {
        type: 'seo',
        websiteUrl: websiteUrl.trim(),
        title: title.trim(),
        description: description.trim(),
        budget: budget.trim(),
      });

      alert('✅ SEO plan request sent to your Sales person!');
      onClose();
    } catch (err) {
      console.error('seo request err:', err);
      setError(
        err.response?.data?.message ||
          'Failed to send request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="SEO Plan Request"
      subtitle="Get a custom SEO plan for your website."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Website URL" required>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={submitting}
          />
        </Field>

        <Field label="Plan Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Monthly SEO Plan"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={submitting}
          />
        </Field>

        <Field label="Description" required>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What services do you need? (On-page, Off-page, Technical SEO, etc.)"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={submitting}
          />
        </Field>

        <Field label="Budget (Optional)">
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. ₹15,000 / month"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={submitting}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <ModalActions
          submitting={submitting}
          onClose={onClose}
          submitLabel="Send Request"
          submitClass="bg-emerald-600 hover:bg-emerald-700"
        />
      </form>
    </ModalShell>
  );
}

/* ============================================================
   MODAL HELPERS
============================================================ */

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function ModalActions({
  submitting,
  onClose,
  submitLabel,
  submitClass = 'bg-blue-600 hover:bg-blue-700',
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60 ${submitClass}`}
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? 'Sending...' : submitLabel}
      </button>
    </div>
  );
}

/* ============================================================
   MEETING REQUEST MODAL
============================================================ */

function MeetingRequestModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState('online');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Meeting title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!meetingDate) {
      setError('Meeting date is required');
      return;
    }

    if (!meetingTime) {
      setError('Meeting time is required');
      return;
    }

    if (meetingType === 'offline' && !meetingAddress.trim()) {
      setError('Address is required for offline meetings');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/client-requests/send', {
        type: 'meeting',
        title: title.trim(),
        description: description.trim(),
        meetingType,
        meetingDate,
        meetingTime,
        meetingDuration,
        meetingAddress:
          meetingType === 'offline'
            ? meetingAddress.trim()
            : '',
        budget: budget.trim(),
      });

      alert('✅ Meeting request sent successfully!');
      onClose();
    } catch (err) {
      console.error('meeting request err:', err);
      setError(
        err.response?.data?.message ||
          'Failed to send request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* Today's date for min */
  const today = new Date().toISOString().split('T')[0];

  return (
    <ModalShell
      title="Meeting Request"
      subtitle="Schedule an online or offline meeting with our team."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {/* TYPE SELECTOR */}
        <Field label="Meeting Type" required>
          <div className="grid grid-cols-2 gap-2">
            {/* ONLINE */}
            <button
              type="button"
              onClick={() => setMeetingType('online')}
              className={`
                flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border-2
                px-4
                py-3
                text-sm
                font-semibold
                transition
                ${
                  meetingType === 'online'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }
              `}
              disabled={submitting}
            >
              <Video size={16} />
              Online
            </button>

            {/* OFFLINE */}
            <button
              type="button"
              onClick={() => setMeetingType('offline')}
              className={`
                flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border-2
                px-4
                py-3
                text-sm
                font-semibold
                transition
                ${
                  meetingType === 'offline'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }
              `}
              disabled={submitting}
            >
              <MapPin size={16} />
              Offline
            </button>
          </div>

          {meetingType === 'online' && (
            <p className="mt-2 text-xs text-gray-500">
              💡 A Jitsi Meet link will be generated automatically.
            </p>
          )}
        </Field>

        {/* TITLE */}
        <Field label="Meeting Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Project Discussion"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={submitting}
          />
        </Field>

        {/* DATE + TIME */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Preferred Date" required>
            <input
              type="date"
              value={meetingDate}
              min={today}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={submitting}
            />
          </Field>

          <Field label="Preferred Time" required>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={submitting}
            />
          </Field>
        </div>

        {/* DURATION */}
        <Field label="Duration" required>
          <select
            value={meetingDuration}
            onChange={(e) => setMeetingDuration(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={submitting}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </Field>

        {/* ADDRESS (only for offline) */}
        {meetingType === 'offline' && (
          <Field label="Address / Location" required>
            <input
              type="text"
              value={meetingAddress}
              onChange={(e) => setMeetingAddress(e.target.value)}
              placeholder="e.g. Zwolf Office, 3rd Floor, Bangalore"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={submitting}
            />
          </Field>
        )}

        {/* DESCRIPTION */}
        <Field label="Purpose / Notes" required>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What would you like to discuss?"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={submitting}
          />
        </Field>

        {/* BUDGET (optional) */}
        <Field label="Budget (Optional)">
          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. ₹5,000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={submitting}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <ModalActions
          submitting={submitting}
          onClose={onClose}
          submitLabel="Send Request"
          submitClass="bg-purple-600 hover:bg-purple-700"
        />
      </form>
    </ModalShell>
  );
}