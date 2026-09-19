import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  FileText,
  Users,
  ClipboardList,
} from 'lucide-react';
import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

export default function SalesProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Project details are required
        const projectResponse = await api.get(`/projects/${id}`);

        setProject(projectResponse.data.data);

        // Tasks are optional for Sales users
        try {
          const tasksResponse = await api.get('/tasks', {
            params: {
              project: id,
              limit: 100,
            },
          });

          setTasks(tasksResponse.data.data);
        } catch (taskError) {
          console.warn(
            'Tasks could not be loaded:',
            taskError.response?.data || taskError.message
          );

          setTasks([]);
        }
      } catch (err) {
        console.error('Project details error:', err);
        console.error('API response:', err.response?.data);

        navigate('/sales/projects', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!project) return null;

  const completed = tasks.filter(
    (t) => t.status === 'Completed'
  ).length;

  const progress = Math.min(
    100,
    Math.max(0, project.progress || 0)
  );

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
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex min-w-0 items-center gap-3">

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
                <BriefcaseBusiness size={21} />
              </div>

              <div className="min-w-0">
                <h1 className="
                  truncate
                  text-xl
                  font-bold
                  tracking-tight
                  text-gray-900
                  sm:text-2xl
                ">
                  {project.projectName}
                </h1>

                <p className="mt-0.5 truncate text-sm text-gray-500">
                  {project.client?.clientName || 'Client not available'}
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

        {/* Status */}
        <div className="
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-sm
          transition-shadow
          duration-200
          hover:shadow-md
        ">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Project Status
              </p>

              <div className="mt-3">
                <Badge color={statusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-blue-50
              text-blue-600
            ">
              <BriefcaseBusiness size={19} />
            </div>

          </div>
        </div>


        {/* Progress */}
        <div className="
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-sm
          transition-shadow
          duration-200
          hover:shadow-md
        ">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Progress
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {progress}%
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-indigo-50
              text-indigo-600
            ">
              <CircleDollarSign size={19} />
            </div>

          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>


        {/* Tasks */}
        <div className="
          rounded-2xl
          border
          border-gray-200
          bg-white
          p-5
          shadow-sm
          transition-shadow
          duration-200
          hover:shadow-md
        ">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tasks Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {completed}
                <span className="ml-1 text-base font-medium text-gray-400">
                  / {tasks.length}
                </span>
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-green-50
              text-green-600
            ">
              <CheckCircle2 size={19} />
            </div>

          </div>

          <p className="mt-2 text-xs text-gray-500">
            Completed project tasks
          </p>
        </div>

      </div>


      {/* =====================================================
          PROJECT INFORMATION
      ===================================================== */}
      <Card>

        <div className="border-b border-gray-100 px-5 py-4">
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
              <FileText size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Project Information
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Overview and project assignment details
              </p>
            </div>

          </div>
        </div>

        <div className="p-5">

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <Info
              icon={BriefcaseBusiness}
              label="Client"
              value={project.client?.clientName}
            />

            <Info
              icon={Code2}
              label="Technology"
              value={project.technology}
            />

            <Info
              icon={ClipboardList}
              label="Priority"
              value={
                project.priority ? (
                  <Badge color={statusColor(project.priority)}>
                    {project.priority}
                  </Badge>
                ) : (
                  '—'
                )
              }
            />

            <Info
              icon={CalendarDays}
              label="Deadline"
              value={formatDate(project.deadline)}
            />

            <Info
              icon={Users}
              label="Sales Employee"
              value={project.salesEmployee?.name}
            />

            <Info
              icon={Users}
              label="Developers"
              value={
                project.developers?.length
                  ? project.developers.map((d) => d.name).join(', ')
                  : '—'
              }
            />

          </div>


          {/* Requirements */}
          {project.requirements && (
            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/70 p-4">

              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />

                <h3 className="text-sm font-semibold text-gray-800">
                  Requirements
                </h3>
              </div>

              <p className="
                mt-3
                whitespace-pre-wrap
                text-sm
                leading-6
                text-gray-600
              ">
                {project.requirements}
              </p>

            </div>
          )}


          {/* Description */}
          {project.description && (
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 p-4">

              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />

                <h3 className="text-sm font-semibold text-gray-800">
                  Description
                </h3>
              </div>

              <p className="
                mt-3
                whitespace-pre-wrap
                text-sm
                leading-6
                text-gray-600
              ">
                {project.description}
              </p>

            </div>
          )}

        </div>

      </Card>


      {/* =====================================================
          TASKS
      ===================================================== */}
  

    </div>
  );
}


/* ============================================================
   INFO COMPONENT
============================================================ */

const Info = ({ icon: Icon, label, value }) => (
  <div className="
    rounded-xl
    border
    border-gray-100
    bg-gray-50/60
    p-4
  ">

    <div className="flex items-start gap-3">

      <div className="
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
      ">
        <Icon size={17} />
      </div>

      <div className="min-w-0">

        <p className="
          text-[11px]
          font-semibold
          uppercase
          tracking-wide
          text-gray-400
        ">
          {label}
        </p>

        <div className="
          mt-1
          break-words
          text-sm
          font-medium
          text-gray-800
        ">
          {value || '—'}
        </div>

      </div>

    </div>

  </div>
);
