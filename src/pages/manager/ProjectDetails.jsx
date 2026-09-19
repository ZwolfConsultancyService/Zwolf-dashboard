import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FolderKanban,
  UserRound,
  UsersRound,
  CalendarDays,
  Code2,
  FileText,
  ListChecks,
  Clock3,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

const PROJECT_STATUSES = [
  'Not Started',
  'Planning',
  'In Progress',
  'On Hold',
  'Testing',
  'Completed',
  'Cancelled',
];

const TASK_STATUSES = [
  'Todo',
  'In Progress',
  'Review',
  'Blocked',
  'Completed',
];

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedDeveloper: '',
    priority: 'Medium',
    status: 'Todo',
    dueDate: '',
    estimatedHours: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [p, t] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', {
          params: {
            project: id,
            limit: 100,
          },
        }),
      ]);

      setProject(p.data.data);
      setTasks(t.data.data);
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load project'
      );
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status) => {
    try {
      await api.patch(`/projects/${id}/status`, { status });
      success('Status updated');
      load();
    } catch (err) {
      toastError(err.response?.data?.message);
    }
  };

  const updateProgress = async (progress) => {
    try {
      await api.patch(`/projects/${id}/progress`, {
        progress: Number(progress),
      });

      load();
    } catch (err) {
      toastError(err.response?.data?.message);
    }
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/tasks', {
        ...taskForm,
        project: id,
      });

      success('Task created');
      setTaskModal(false);

      setTaskForm({
        title: '',
        description: '',
        assignedDeveloper: '',
        priority: 'Medium',
        status: 'Todo',
        dueDate: '',
        estimatedHours: 0,
      });

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to create task'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      success('Task deleted');
      load();
    } catch (err) {
      toastError(err.response?.data?.message);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      load();
    } catch (err) {
      toastError(err.response?.data?.message);
    }
  };

  if (loading) return <Loader />;

  if (!project) return null;

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-3">

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="shrink-0 rounded-xl border-gray-200 bg-white px-3 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderKanban size={21} />
              </div>

              <div className="min-w-0">

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Project Details
                </p>

                <h1 className="mt-0.5 truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  {project.projectName}
                </h1>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {project.client?.clientName || 'Client not assigned'}
                </p>

              </div>
            </div>
          </div>

          {/* Project Status */}
          <div className="w-full sm:w-auto">

            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Project Status
            </div>

            <Select
              value={project.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full rounded-xl sm:min-w-[190px]"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>

          </div>

        </div>
      </div>

      {/* Project Information + Progress */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Project Information */}
        <Card className="overflow-hidden xl:col-span-2">

          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FolderKanban size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Project Information
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Project details and requirements
                </p>
              </div>

            </div>
          </div>

          <div className="p-5">

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <Info
                icon={UserRound}
                label="Client"
                value={project.client?.clientName}
              />

              <Info
                icon={UserRound}
                label="Sales Executive"
                value={project.salesEmployee?.name}
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
                  <Badge color={statusColor(project.priority)}>
                    {project.priority}
                  </Badge>
                }
              />

              <Info
                icon={CalendarDays}
                label="Start Date"
                value={formatDate(project.startDate)}
              />

              <Info
                icon={CalendarDays}
                label="Deadline"
                value={formatDate(project.deadline)}
              />

            </div>

            {/* Developers */}
            <div className="mt-5">
              <Info
                icon={UsersRound}
                label="Developers"
                value={project.developers?.map((d) => d.name).join(', ')}
                full
              />
            </div>

            {/* Requirements */}
            <div className="mt-4">
              <Info
                icon={ListChecks}
                label="Requirements"
                value={project.requirements}
                full
              />
            </div>

            {/* Description */}
            <div className="mt-4">
              <Info
                icon={FileText}
                label="Description"
                value={project.description}
                full
              />
            </div>

          </div>
        </Card>

        {/* Project Progress */}
        <Card className="overflow-hidden">

          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Project Progress
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Overall completion
                </p>
              </div>

            </div>
          </div>

          <div className="p-5">

            <div className="flex justify-center py-3">

              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-blue-100 bg-blue-50">

                <div className="text-center">

                  <p className="text-3xl font-bold text-blue-600">
                    {project.progress}%
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Complete
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-5">

              <div className="mb-2 flex items-center justify-between">

                <span className="text-xs font-medium text-gray-500">
                  Overall progress
                </span>

                <span className="text-xs font-semibold text-blue-600">
                  {project.progress}%
                </span>

              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={project.progress}
                onChange={(e) =>
                  setProject({
                    ...project,
                    progress: Number(e.target.value),
                  })
                }
                onMouseUp={(e) => updateProgress(e.target.value)}
                onTouchEnd={(e) => updateProgress(e.target.value)}
                className="w-full cursor-pointer accent-blue-600"
              />

              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>

            </div>

            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                  <Clock3 size={17} />
                </div>

                <div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    Current Status
                  </p>

                  <div className="mt-1">
                    <Badge color={statusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </Card>

      </div>

      {/* Tasks */}
      <Card className="overflow-hidden">

        <div className="border-b border-gray-100 px-5 py-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <ListChecks size={18} />
              </div>

              <div>

                <h2 className="text-base font-semibold text-gray-900">
                  Project Tasks
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Manage tasks assigned to this project
                </p>

              </div>

            </div>

            <div className="flex items-center gap-2">

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {tasks.length} Tasks
              </span>

              <Button
                size="sm"
                onClick={() => setTaskModal(true)}
                className="rounded-xl bg-blue-600 shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
              >
                <Plus size={14} />
                Add Task
              </Button>

            </div>

          </div>
        </div>

        <div className="p-5">

          {tasks.length === 0 ? (

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                <ListChecks size={21} />
              </div>

              <p className="mt-3 text-sm font-semibold text-gray-700">
                No tasks yet
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Create your first task for this project.
              </p>

              <Button
                size="sm"
                onClick={() => setTaskModal(true)}
                className="mt-4 rounded-xl"
              >
                <Plus size={14} />
                Add First Task
              </Button>

            </div>

          ) : (

            <div className="space-y-3">

              {tasks.map((t) => (

                <div
                  key={t._id}
                  className="group rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                    {/* Task Information */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                        <ClipboardList size={18} />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-gray-900">
                          {t.title}
                        </p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">

                          <span className="flex items-center gap-1">
                            <UserRound size={12} />
                            {t.assignedDeveloper?.name || 'Unassigned'}
                          </span>

                          <span className="text-gray-300">
                            •
                          </span>

                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            Due {formatDate(t.dueDate)}
                          </span>

                          {t.estimatedHours ? (
                            <>
                              <span className="text-gray-300">
                                •
                              </span>

                              <span className="flex items-center gap-1">
                                <Clock3 size={12} />
                                {t.estimatedHours} hrs
                              </span>
                            </>
                          ) : null}

                        </div>

                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex flex-wrap items-center gap-2">

                      <Select
                        value={t.status}
                        onChange={(e) =>
                          updateTaskStatus(t._id, e.target.value)
                        }
                        className="min-w-[140px] rounded-lg bg-white"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>

                      <Badge color={statusColor(t.priority)}>
                        {t.priority}
                      </Badge>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteTask(t._id)}
                        className="rounded-lg transition-all duration-200"
                      >
                        <Trash2 size={14} />
                      </Button>

                    </div>

                  </div>
                </div>

              ))}

            </div>

          )}

        </div>
      </Card>

      {/* Add Task Modal */}
      <Modal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        title="Add New Task"
      >

        <form
          onSubmit={submitTask}
          className="space-y-5"
        >

          <Input
            label="Title *"
            required
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm({
                ...taskForm,
                title: e.target.value,
              })
            }
          />

          <Select
            label="Assign Developer *"
            required
            value={taskForm.assignedDeveloper}
            onChange={(e) =>
              setTaskForm({
                ...taskForm,
                assignedDeveloper: e.target.value,
              })
            }
          >
            <option value="">
              Select developer
            </option>

            {project.developers?.map((d) => (
              <option
                key={d._id}
                value={d._id}
              >
                {d.name}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Select
              label="Priority"
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  priority: e.target.value,
                })
              }
            >
              {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                <option key={p}>
                  {p}
                </option>
              ))}
            </Select>

            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  dueDate: e.target.value,
                })
              }
            />

          </div>

          <Input
            label="Estimated Hours"
            type="number"
            value={taskForm.estimatedHours}
            onChange={(e) =>
              setTaskForm({
                ...taskForm,
                estimatedHours: Number(e.target.value),
              })
            }
          />

          <div>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              className="input-base w-full resize-none rounded-xl focus:ring-2 focus:ring-blue-500/10"
              rows="4"
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  description: e.target.value,
                })
              }
              placeholder="Enter task description..."
            />

          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">

            <Button
              type="button"
              variant="outline"
              onClick={() => setTaskModal(false)}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-xl px-5 font-semibold"
            >
              Create Task
            </Button>

          </div>

        </form>
      </Modal>

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
  full = false,
}) => (
  <div
    className={`rounded-xl border border-gray-100 bg-gray-50/60 p-4 ${
      full ? 'w-full' : ''
    }`}
  >

    <div className="flex items-start gap-3">

      {Icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
          <Icon size={17} />
        </div>
      )}

      <div className="min-w-0">

        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <div className="mt-1 break-words whitespace-pre-wrap text-sm font-medium leading-6 text-gray-800">
          {value || '—'}
        </div>

      </div>

    </div>

  </div>
);