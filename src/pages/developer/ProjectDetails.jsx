import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  FolderKanban,
  UserRound,
  CalendarDays,
  Code2,
  Clock3,
  CheckCircle2,
  CircleDot,
  Flag,
  FileText,
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

const TASK_STATUSES = [
  'Todo',
  'In Progress',
  'Review',
  'Blocked',
  'Completed',
];

const PROJECT_STATUSES = [
  'Not Started',
  'Planning',
  'In Progress',
  'On Hold',
  'Testing',
  'Completed',
  'Cancelled',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function DeveloperProjectDetails() {
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
    priority: 'Medium',
    status: 'Todo',
    dueDate: '',
    estimatedHours: 0,
  });

  const [editModal, setEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    projectName: '',
    description: '',
    technology: '',
    startDate: '',
    deadline: '',
    priority: 'Medium',
    status: 'Not Started',
    progress: 0,
    requirements: '',
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

  const quickUpdateStatus = async (newStatus) => {
    try {
      await api.put(`/projects/${id}`, {
        status: newStatus,
      });

      success('Status updated');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to update status'
      );
    }
  };

  const quickUpdateProgress = async (newProgress) => {
    try {
      await api.put(`/projects/${id}`, {
        progress: Number(newProgress),
      });

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to update progress'
      );
    }
  };

  const openEdit = () => {
    setEditForm({
      projectName: project.projectName || '',
      description: project.description || '',
      technology: project.technology || '',
      startDate: project.startDate
        ? project.startDate.slice(0, 10)
        : '',
      deadline: project.deadline
        ? project.deadline.slice(0, 10)
        : '',
      priority: project.priority || 'Medium',
      status: project.status || 'Not Started',
      progress: project.progress || 0,
      requirements: project.requirements || '',
    });

    setEditModal(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/projects/${id}`, editForm);

      success('Project updated');
      setEditModal(false);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to update project'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, {
        status,
      });

      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to update task'
      );
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

  if (loading) return <Loader />;
  if (!project) return null;

  const progress = Math.min(
    100,
    Math.max(0, Number(project.progress) || 0)
  );

  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
  ).length;

  return (
    <div className="min-h-full space-y-6 bg-gray-50/50 pb-10">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <div className="h-8 w-px bg-gray-200" />

            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
                <FolderKanban size={21} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                    {project.projectName}
                  </h1>

                  <Badge color={statusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <UserRound size={14} />
                  <span>
                    {project.client?.clientName || 'No client'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={openEdit}>
            <Edit size={16} />
            Edit Project
          </Button>
        </div>
      </div>

      {/* =========================================================
          PROJECT SUMMARY
      ========================================================= */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        {/* Status */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CircleDot size={18} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Project Status
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  Current Status
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={project.status}
              onChange={(e) =>
                quickUpdateStatus(e.target.value)
              }
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Progress */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Project Progress
                </p>

                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {progress}% Completed
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Overall completion
              </span>

              <span className="text-sm font-bold text-indigo-600">
                {progress}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) =>
                setProject({
                  ...project,
                  progress: Number(e.target.value),
                })
              }
              onMouseUp={(e) =>
                quickUpdateProgress(e.target.value)
              }
              onTouchEnd={(e) =>
                quickUpdateProgress(e.target.value)
              }
              className="mt-4 w-full accent-indigo-600"
            />

            <div className="mt-1 flex justify-between text-[10px] font-medium text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </Card>

        {/* Priority */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Flag size={18} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Project Priority
                </p>

                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  Current Priority
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center p-5">
            <Badge color={statusColor(project.priority)}>
              {project.priority}
            </Badge>
          </div>
        </Card>
      </div>

      {/* =========================================================
          PROJECT INFO
      ========================================================= */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Project Information
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Basic details, timeline and project requirements
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">

            <Info
              icon={<UserRound size={15} />}
              label="Client"
              value={project.client?.clientName}
            />

            <Info
              icon={<UserRound size={15} />}
              label="Sales Employee"
              value={project.salesEmployee?.name}
            />

            <Info
              icon={<Code2 size={15} />}
              label="Technology"
              value={project.technology}
            />

            <Info
              icon={<CalendarDays size={15} />}
              label="Start Date"
              value={formatDate(project.startDate)}
            />

            <Info
              icon={<CalendarDays size={15} />}
              label="Deadline"
              value={formatDate(project.deadline)}
            />

            <Info
              icon={<UserRound size={15} />}
              label="Developers"
              value={
                project.developers
                  ?.map((d) => d.name)
                  .join(', ') || '—'
              }
            />

            <div className="sm:col-span-2 lg:col-span-3">
              <Info
                icon={<FileText size={15} />}
                label="Requirements"
                value={project.requirements}
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Info
                icon={<FileText size={15} />}
                label="Description"
                value={project.description}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* =========================================================
          TASKS
      ========================================================= */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle2 size={18} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Project Tasks
                </h2>

                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  {tasks.length}
                </span>
              </div>

              <p className="mt-0.5 text-xs text-gray-500">
                Manage and track assigned development tasks
              </p>
            </div>
          </div>
{/* 
          <Button
            size="sm"
            onClick={() => setTaskModal(true)}
          >
            <Plus size={14} />
            Add Task
          </Button> */}
        </div>

        <div className="p-5">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-5 py-10 text-center">
              <CheckCircle2
                size={28}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm font-medium text-gray-600">
                No tasks yet
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Create a task to start tracking project work.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            task.status === 'Completed'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {task.status === 'Completed' ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <CircleDot size={16} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {task.title}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            <span>
                              {task.assignedDeveloper?.name ||
                                'Unassigned'}
                            </span>

                            <span className="text-gray-300">
                              •
                            </span>

                            <span className="flex items-center gap-1">
                              <CalendarDays size={12} />
                              Due {formatDate(task.dueDate)}
                            </span>

                            {task.estimatedHours > 0 && (
                              <>
                                <span className="text-gray-300">
                                  •
                                </span>

                                <span className="flex items-center gap-1">
                                  <Clock3 size={12} />
                                  {task.estimatedHours}h
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Badge color={statusColor(task.priority)}>
                        {task.priority}
                      </Badge>

                      <select
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={task.status}
                        onChange={(e) =>
                          updateTaskStatus(
                            task._id,
                            e.target.value
                          )
                        }
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Task completion
              </span>

              <span className="font-semibold text-gray-700">
                {completedTasks} / {tasks.length} completed
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* =========================================================
          PROJECT EDIT MODAL
      ========================================================= */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Project"
        size="lg"
      >
        <form onSubmit={submitEdit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Project Name *"
              required
              value={editForm.projectName}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  projectName: e.target.value,
                })
              }
            />

            <Input
              label="Technology"
              value={editForm.technology}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  technology: e.target.value,
                })
              }
            />

            <Input
              label="Start Date"
              type="date"
              value={editForm.startDate}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  startDate: e.target.value,
                })
              }
            />

            <Input
              label="Deadline"
              type="date"
              value={editForm.deadline}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  deadline: e.target.value,
                })
              }
            />

            <Select
              label="Priority"
              value={editForm.priority}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  priority: e.target.value,
                })
              }
            >
              {PRIORITIES.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </Select>

            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  status: e.target.value,
                })
              }
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>

            <Input
              label="Progress (%)"
              type="number"
              min="0"
              max="100"
              value={editForm.progress}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  progress: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Requirements
            </label>

            <textarea
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              rows={3}
              value={editForm.requirements}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  requirements: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              rows={3}
              value={editForm.description}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
            >
              Update Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          TASK MODAL
      ========================================================= */}
      <Modal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        title="Add Task"
      >
        <form onSubmit={submitTask}>
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
            label="Priority"
            value={taskForm.priority}
            onChange={(e) =>
              setTaskForm({
                ...taskForm,
                priority: e.target.value,
              })
            }
          >
            {PRIORITIES.map((priority) => (
              <option key={priority}>{priority}</option>
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

          <Input
            label="Estimated Hours"
            type="number"
            min="0"
            value={taskForm.estimatedHours}
            onChange={(e) =>
              setTaskForm({
                ...taskForm,
                estimatedHours: Number(e.target.value),
              })
            }
          />

          <div className="form-group">
            <label className="form-label">
              Description
            </label>

            <textarea
              className="form-textarea"
              rows={3}
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({
                  ...taskForm,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTaskModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================
   INFO COMPONENT
========================================================= */

const Info = ({ icon, label, value }) => (
  <div className="min-w-0">
    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
      {icon}
      <span>{label}</span>
    </div>

    <div className="break-words text-sm font-medium leading-6 text-gray-800">
      {value || '—'}
    </div>
  </div>
);