import { useEffect, useState } from 'react';
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Code2,
  CalendarCheck2,
  CalendarDays,
  Timer,
} from 'lucide-react';

import api from '../../api/axios.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

export default function DeveloperDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/developer').then((res) => {
      setData(res.data.data);
    });
  }, []);

  if (!data) {
    return <Loader />;
  }

  const { cards, upcomingDeadlines, attendance } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Code2 size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Developer Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Developer Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Track your projects, tasks, deadlines and attendance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <FolderKanban size={16} className="text-purple-600" />

            <span className="text-sm font-medium text-gray-600">
              Work Overview
            </span>
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <ListChecks size={16} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Work Overview
            </h2>

            <p className="text-xs text-gray-500">
              Your current projects and task progress
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label="My Projects"
            value={cards.myProjects}
            icon={FolderKanban}
          />

          <StatCard
            label="My Tasks"
            value={cards.myTasks}
            icon={ListChecks}
            color="blue"
          />

          <StatCard
            label="Completed"
            value={cards.completedTasks}
            icon={CheckCircle2}
            color="green"
          />

          <StatCard
            label="Pending"
            value={cards.pendingTasks}
            icon={Clock}
            color="yellow"
          />

          <StatCard
            label="Blocked"
            value={cards.blockedTasks}
            icon={AlertTriangle}
            color="red"
          />
        </div>
      </div>

      {/* Attendance + Deadlines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Attendance */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CalendarCheck2 size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Today's Attendance
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Your current attendance status
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {attendance?.loginTime ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <Timer size={15} />
                    </div>

                    <span className="text-xs font-medium text-gray-500">
                      Login
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-gray-900">
                  {new Date(attendance.loginTime).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Clock size={15} />
                    </div>

                    <span className="text-xs font-medium text-gray-500">
                      Logout
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-semibold text-gray-900">
                 {attendance.logoutTime
  ? new Date(attendance.logoutTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <CalendarCheck2 size={21} />
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No attendance yet today
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Your attendance details will appear here.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <CalendarDays size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Upcoming Deadlines
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Tasks that need your attention
                </p>
              </div>
            </div>
          </div>

          <div className="px-5">
            {upcomingDeadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <CalendarDays size={21} />
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  Nothing upcoming
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  You have no upcoming task deadlines.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcomingDeadlines.map((t) => (
                  <li
                    key={t._id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <ListChecks size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {t.title}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {t.project?.projectName}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500">
                      <CalendarDays size={13} />
                      <span>{formatDate(t.dueDate)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}