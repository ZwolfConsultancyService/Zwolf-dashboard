import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Code2,
  FileText,
  Users,
  ClipboardList,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

export default function ClientProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
    const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);

        const response = await api.get(
          `/client-portal/projects/${id}`
        );

        setProject(response.data?.data || null);
      } catch (error) {
        console.error(
          'CLIENT PROJECT DETAILS ERROR:',
          error.response?.data || error.message
        );

        navigate('/client/dashboard', {
          replace: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, navigate]);

  if (loading) {
    return <Loader text="Loading project..." />;
  }

  if (!project) {
    return null;
  }

  const progress = Math.min(
    100,
    Math.max(
      0,
      Number(project.progress || 0)
    )
  );

  const developers = project.developers || [];

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex min-w-0 items-center gap-3">

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="
                shrink-0
                rounded-xl
                border-gray-200
                px-3
                shadow-sm
                transition-all
                duration-200
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
              "
            >
              <ArrowLeft size={16} />

              <span className="hidden sm:inline">
                Back
              </span>
            </Button>

            <div className="flex min-w-0 items-center gap-3">

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-50
                  text-blue-600
                "
              >
                <BriefcaseBusiness size={21} />
              </div>

              <div className="min-w-0">

                <h1
                  className="
                    truncate
                    text-xl
                    font-bold
                    tracking-tight
                    text-gray-900
                    sm:text-2xl
                  "
                >
                  {project.projectName}
                </h1>

                <p className="mt-0.5 truncate text-sm text-gray-500">
                  {project.client?.clientName ||
                    project.client?.companyName ||
                    'Your Project'}
                </p>

              </div>

            </div>

          </div>

          <Badge color={statusColor(project.status)}>
            {project.status}
          </Badge>

        </div>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* STATUS */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
            transition-shadow
            duration-200
            hover:shadow-md
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Project Status
              </p>

              <div className="mt-3">
                <Badge
                  color={statusColor(project.status)}
                >
                  {project.status}
                </Badge>
              </div>

            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-blue-50
                text-blue-600
              "
            >
              <BriefcaseBusiness size={19} />
            </div>

          </div>

        </div>


        {/* PROGRESS */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
            transition-shadow
            duration-200
            hover:shadow-md
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Progress
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {progress}%
              </p>

            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
                text-indigo-600
              "
            >
              <CircleDollarSign size={19} />
            </div>

          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>


        {/* PRIORITY */}

        <div
          className="
            rounded-2xl
            border
            border-gray-200
            bg-white
            p-5
            shadow-sm
            transition-shadow
            duration-200
            hover:shadow-md
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Priority
              </p>

              <div className="mt-3">

                {project.priority ? (
                  <Badge
                    color={statusColor(
                      project.priority
                    )}
                  >
                    {project.priority}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">
                    —
                  </span>
                )}

              </div>

            </div>

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-orange-50
                text-orange-600
              "
            >
              <ClipboardList size={19} />
            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          PROGRESS DETAILS
      ===================================================== */}

      <Card>

        <div className="border-b border-gray-100 px-5 py-4">

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
              "
            >
              <BriefcaseBusiness size={18} />
            </div>

            <div>

              <h2 className="text-base font-semibold text-gray-900">
                Project Progress
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Current progress of your project
              </p>

            </div>

          </div>

        </div>

        <div className="p-5">

          <div className="flex items-center justify-between">

            <span className="text-sm font-medium text-gray-600">
              Overall Progress
            </span>

            <span className="text-lg font-bold text-blue-600">
              {progress}%
            </span>

          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">

            <span>
              Started
            </span>

            <span>
              {progress >= 100
                ? 'Completed'
                : 'In Progress'}
            </span>

          </div>

        </div>

      </Card>


      {/* =====================================================
          PROJECT INFORMATION
      ===================================================== */}

      <Card>

        <div className="border-b border-gray-100 px-5 py-4">

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-blue-50
                text-blue-600
              "
            >
              <FileText size={18} />
            </div>

            <div>

              <h2 className="text-base font-semibold text-gray-900">
                Project Information
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Overview and project details
              </p>

            </div>

          </div>

        </div>

        <div className="p-5">

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* CLIENT */}

            <Info
  icon={UserRound}
  label="Client"
  value={user?.name}
/>

            {/* COMPANY */}

           <Info
  icon={BriefcaseBusiness}
  label="Company"
  value="ZWOLF Consultancy Service"
/>

            {/* TECHNOLOGY */}

            <Info
              icon={Code2}
              label="Technology"
              value={
                project.technology
              }
            />

            {/* START DATE */}

            <Info
              icon={CalendarDays}
              label="Start Date"
              value={
                formatDate(
                  project.startDate
                )
              }
            />

            {/* DEADLINE */}

            <Info
              icon={CalendarDays}
              label="Deadline"
              value={
                formatDate(
                  project.deadline
                )
              }
            />

            {/* SALES EMPLOYEE */}

            <Info
              icon={Users}
              label="Project Contact"
              value={
                project.salesEmployee?.name
              }
            />

            {/* DEVELOPERS */}

            <Info
              icon={Users}
              label="Development Team"
              value={
                developers.length
                  ? developers
                      .map(
                        (developer) =>
                          developer.name
                      )
                      .join(', ')
                  : '—'
              }
            />

          </div>


          {/* =================================================
              REQUIREMENTS
          ================================================= */}

          {project.requirements && (
            <div
              className="
                mt-6
                rounded-xl
                border
                border-gray-100
                bg-gray-50/70
                p-4
              "
            >

              <div className="flex items-center gap-2">

                <FileText
                  size={16}
                  className="text-blue-600"
                />

                <h3 className="text-sm font-semibold text-gray-800">
                  Requirements
                </h3>

              </div>

              <p
                className="
                  mt-3
                  whitespace-pre-wrap
                  text-sm
                  leading-6
                  text-gray-600
                "
              >
                {project.requirements}
              </p>

            </div>
          )}


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          {project.description && (
            <div
              className="
                mt-4
                rounded-xl
                border
                border-gray-100
                bg-gray-50/70
                p-4
              "
            >

              <div className="flex items-center gap-2">

                <FileText
                  size={16}
                  className="text-blue-600"
                />

                <h3 className="text-sm font-semibold text-gray-800">
                  Description
                </h3>

              </div>

              <p
                className="
                  mt-3
                  whitespace-pre-wrap
                  text-sm
                  leading-6
                  text-gray-600
                "
              >
                {project.description}
              </p>

            </div>
          )}

        </div>

      </Card>

    </div>
  );
}


/* ============================================================
   INFO COMPONENT
============================================================ */

const Info = ({
  icon: Icon,
  label,
  value,
}) => (
  <div
    className="
      rounded-xl
      border
      border-gray-100
      bg-gray-50/60
      p-4
    "
  >

    <div className="flex items-start gap-3">

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-white
          text-blue-600
          shadow-sm
        "
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0">

        <p
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-wide
            text-gray-400
          "
        >
          {label}
        </p>

        <div
          className="
            mt-1
            break-words
            text-sm
            font-medium
            text-gray-800
          "
        >
          {value || '—'}
        </div>

      </div>

    </div>

  </div>
);