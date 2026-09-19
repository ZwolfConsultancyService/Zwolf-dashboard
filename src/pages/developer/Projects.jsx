import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  UserRound,
  Flag,
  CalendarDays,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatDate } from '../../utils/format.js';

export default function DeveloperProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/projects', {
        params: {
          page,
          limit: 10,
        },
      });

      setProjects(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FolderKanban size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Developer Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                My Projects
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View your assigned projects and track their progress
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <FolderKanban size={16} className="text-purple-600" />

            <span className="text-sm font-medium text-gray-600">
              {projects.length} Projects
            </span>
          </div>
        </div>
      </div>

      {/* Projects */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Project Overview
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Monitor project status, priority, progress and deadlines
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <Table
            loading={loading}
            data={projects}
            columns={[
              {
                header: 'Project',
                render: (r) => (
                  <button
                    onClick={() =>
                      navigate(`/developer/projects/${r._id}`)
                    }
                    className="group flex min-w-[220px] items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <FolderKanban size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-primary-600 group-hover:underline">
                          {r.projectName}
                        </p>

                        <ArrowRight
                          size={14}
                          className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5"
                        />
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <UserRound
                          size={12}
                          className="text-gray-400"
                        />

                        <p className="truncate text-xs text-gray-500">
                          {r.client?.clientName}
                        </p>
                      </div>
                    </div>
                  </button>
                ),
              },

              {
                header: 'Status',
                render: (r) => (
                  <Badge color={statusColor(r.status)}>
                    {r.status}
                  </Badge>
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
  header: 'Progress',
  render: (r) => {
    const progress = Math.min(
      100,
      Math.max(0, Number(r.progress) || 0)
    );

    return (
      <div className="min-w-[160px]">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">
            Progress
          </span>

          <span className="text-xs font-semibold text-gray-700">
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

        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>Started</span>
          <span>Completed</span>
        </div>
      </div>
    );
  },
},
              {
                header: 'Deadline',
                render: (r) => (
                  <div className="flex min-w-[130px] items-center gap-2">
                    <CalendarDays
                      size={15}
                      className="text-gray-400"
                    />

                    <span className="text-sm text-gray-700">
                      {formatDate(r.deadline)}
                    </span>
                  </div>
                ),
              },
            ]}
          />
        </div>

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