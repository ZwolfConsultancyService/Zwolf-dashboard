import { useEffect, useState, useCallback } from 'react';
import {
  ListChecks,
  Filter,
  FolderKanban,
  Flag,
  CalendarDays,
  Clock3,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Select from '../../components/ui/Select.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatDate } from '../../utils/format.js';

const STATUSES = ['Todo', 'In Progress', 'Review', 'Blocked', 'Completed'];

export default function DeveloperTasks() {
  const { error: toastError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: 10,
      };

      if (status) {
        params.status = status;
      }

      const { data } = await api.get('/tasks', { params });

      setTasks(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });

      load();
    } catch (err) {
      toastError(err.response?.data?.message);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ListChecks size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Developer Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                My Tasks
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your assigned tasks and update their progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <ListChecks size={16} className="text-purple-600" />

            <span className="text-sm font-medium text-gray-600">
              {tasks.length} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <Card className="overflow-hidden">
        {/* Section Header */}
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FolderKanban size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Task Management
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                View assigned tasks and manage their current status
              </p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-500" />

              <span className="text-sm font-medium text-gray-700">
                Filter by status
              </span>
            </div>

            <div className="w-full sm:max-w-xs">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>

                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto p-5">
          <Table
            loading={loading}
            data={tasks}
            columns={[
              {
                header: 'Task',
                render: (r) => (
                  <div className="flex min-w-[220px] items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <ListChecks size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {r.title}
                      </p>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <FolderKanban
                          size={12}
                          className="text-gray-400"
                        />

                        <p className="truncate text-xs text-gray-500">
                          {r.project?.projectName}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              },

              {
                header: 'Priority',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Flag
                      size={15}
                      className="text-orange-500"
                    />

                    <Badge color={statusColor(r.priority)}>
                      {r.priority}
                    </Badge>
                  </div>
                ),
              },

              {
                header: 'Status',
                render: (r) => (
                  <div className="min-w-[150px]">
                    <Select
                      value={r.status}
                      onChange={(e) =>
                        updateStatus(r._id, e.target.value)
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </div>
                ),
              },

              {
                header: 'Due',
                render: (r) => (
                  <div className="flex min-w-[120px] items-center gap-2">
                    <CalendarDays
                      size={15}
                      className="text-gray-400"
                    />

                    <span className="text-sm text-gray-700">
                      {formatDate(r.dueDate)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Est. Hours',
                render: (r) => (
                  <div className="flex min-w-[110px] items-center gap-2">
                    <Clock3
                      size={15}
                      className="text-gray-400"
                    />

                    <span className="text-sm font-medium text-gray-700">
                      {r.estimatedHours}
                    </span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-100 px-5 py-4">
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
          />
        </div>
      </Card>
    </div>
  );
}