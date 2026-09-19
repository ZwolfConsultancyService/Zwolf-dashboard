import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Clock3,
  UserRound,
  Layers3,
  Zap,
  FileText,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function ManagerActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/activity-logs', {
        params: {
          page,
          limit: 20,
        },
      });

      setLogs(data.data);
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Manager Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Activity Logs
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Monitor user actions and system activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <Activity size={16} className="text-blue-600" />

            <span className="text-sm font-medium text-gray-600">
              {logs.length} Activities
            </span>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Layers3 size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                System Activity
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Track recent actions performed across the system
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <Table
            loading={loading}
            data={logs}
            columns={[
              {
                header: 'Time',
                render: (r) => (
                  <div className="flex min-w-[150px] items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Clock3 size={15} />
                    </div>

                    <span className="text-sm text-gray-700">
                      {formatDateTime(r.createdAt)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'User',
                render: (r) => (
                  <div className="flex min-w-[150px] items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <UserRound size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {r.user?.name || '—'}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        User
                      </p>
                    </div>
                  </div>
                ),
              },

              {
                header: 'Module',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Layers3 size={15} />
                    </div>

                    <Badge color="blue">
                      {r.module}
                    </Badge>
                  </div>
                ),
              },

              {
                header: 'Action',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Zap size={15} />
                    </div>

                    <Badge>
                      {r.action}
                    </Badge>
                  </div>
                ),
              },

              {
                header: 'Description',
                render: (r) => (
                  <div className="flex min-w-[240px] items-start gap-2">
                    <FileText
                      size={15}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />

                    <span className="text-sm leading-5 text-gray-700">
                      {r.description || '—'}
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