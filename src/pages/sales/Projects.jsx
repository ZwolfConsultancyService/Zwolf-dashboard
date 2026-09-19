import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  CalendarDays,
  Users,
  ArrowRight,
} from 'lucide-react';
import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatDate } from '../../utils/format.js';

export default function SalesProjects() {
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
    <div className="space-y-5">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BriefcaseBusiness size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  My Projects
                </h1>

                <p className="mt-0.5 text-sm text-gray-500">
                  View project progress, status, developers and deadlines.
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span>{' '}
            Projects are updated by developers. As a sales user, you can
            view project progress and details.
          </p>
        </div>
      </div>


      {/* =====================================================
          PROJECT TABLE
      ===================================================== */}
      <Card>
        <div className="overflow-hidden">

          {/* Table Header */}
          <div className="flex flex-col gap-1 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Project Overview
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Track your assigned client projects
              </p>
            </div>

            <div className="text-xs font-medium text-gray-500">
              {pagination?.total
                ? `${pagination.total} project${pagination.total !== 1 ? 's' : ''}`
                : `${projects.length} projects`}
            </div>
          </div>


          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Project
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Client
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Progress
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Developers
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Deadline
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>
              </thead>


              <tbody className="divide-y divide-gray-100 bg-white">

                {/* Loading */}
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center justify-center">

                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

                        <p className="mt-3 text-sm font-medium text-gray-600">
                          Loading projects...
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Please wait
                        </p>

                      </div>
                    </td>
                  </tr>
                ) : projects.length === 0 ? (

                  /* Empty State */
                  <tr>
                    <td colSpan={8} className="px-5 py-14">

                      <div className="flex flex-col items-center justify-center text-center">

                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                          <BriefcaseBusiness size={24} />
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-gray-900">
                          No projects yet
                        </h3>

                        <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">
                          Projects assigned to you will appear here once
                          they are created.
                        </p>

                      </div>

                    </td>
                  </tr>

                ) : (

                  /* Projects */
                  projects.map((p) => (

                    <tr
                      key={p._id}
                      className="group transition-colors duration-150 hover:bg-gray-50/70"
                    >

                      {/* Project */}
                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/sales/projects/${p._id}`)
                          }
                          className="group/project text-left"
                        >
                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover/project:bg-blue-100">
                              <BriefcaseBusiness size={17} />
                            </div>

                            <div className="min-w-0">

                              <div className="max-w-[220px] truncate text-sm font-semibold text-gray-900 transition-colors group-hover/project:text-blue-600">
                                {p.projectName}
                              </div>

                              <div className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">
                                {p.technology || 'Technology not specified'}
                              </div>

                            </div>

                          </div>
                        </button>

                      </td>


                      {/* Client */}
                      <td className="px-5 py-4">

                        <div className="max-w-[180px] truncate text-sm font-medium text-gray-800">
                          {p.client?.clientName || '—'}
                        </div>

                        {p.client?.companyName && (
                          <div className="mt-0.5 max-w-[180px] truncate text-xs text-gray-400">
                            {p.client.companyName}
                          </div>
                        )}

                      </td>


                      {/* Status */}
                      <td className="px-5 py-4">
                        <Badge color={statusColor(p.status)}>
                          {p.status}
                        </Badge>
                      </td>


                      {/* Priority */}
                      <td className="px-5 py-4">
                        <Badge color={statusColor(p.priority)}>
                          {p.priority}
                        </Badge>
                      </td>


                      {/* Progress */}
                      <td className="px-5 py-4">

                        <div className="w-[150px]">

                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Progress
                            </span>

                            <span className="text-xs font-semibold text-blue-600">
                              {p.progress || 0}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">

                            <div
                              className="h-full rounded-full bg-blue-600 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, p.progress || 0)
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* Developers */}
                      <td className="px-5 py-4">

                        {p.developers?.length ? (

                          <div className="flex max-w-[190px] items-center gap-2">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <Users size={15} />
                            </div>

                            <div className="min-w-0">

                              <div className="truncate text-sm font-medium text-gray-700">
                                {p.developers
                                  .map((d) => d.name)
                                  .join(', ')}
                              </div>

                              <div className="text-xs text-gray-400">
                                {p.developers.length}{' '}
                                {p.developers.length === 1
                                  ? 'developer'
                                  : 'developers'}
                              </div>

                            </div>

                          </div>

                        ) : (
                          <span className="text-sm text-gray-400">
                            No developers
                          </span>
                        )}

                      </td>


                      {/* Deadline */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                            <CalendarDays size={15} />
                          </div>

                          <span className="text-sm font-medium text-gray-700">
                            {formatDate(p.deadline)}
                          </span>

                        </div>

                      </td>


                      {/* Action */}
                      <td className="px-5 py-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/sales/projects/${p._id}`)
                          }
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-gray-200
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-gray-600
                            shadow-sm
                            transition-all
                            duration-200
                            hover:border-blue-200
                            hover:bg-blue-50
                            hover:text-blue-600
                          "
                        >
                          View
                          <ArrowRight size={14} />
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>
          </div>


          {/* Pagination */}
          {pagination && (
            <div className="border-t border-gray-100 px-5 py-4">
              <Pagination
                pagination={pagination}
                onPageChange={setPage}
              />
            </div>
          )}

        </div>
      </Card>

    </div>
  );
}