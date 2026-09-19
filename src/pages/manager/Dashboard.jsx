import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  Code2,
  UserCircle,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarCheck2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import api from '../../api/axios.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatCurrency } from '../../utils/format.js';

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#6b7280',
];

export default function ManagerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/manager').then((res) => {
      setData(res.data.data);
    });
  }, []);

  if (!data) {
    return <Loader text="Loading dashboard..." />;
  }

  const { cards, attendance, charts } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Manager Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Overview of employees, projects, revenue and attendance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <TrendingUp size={16} className="text-blue-600" />

            <span className="text-sm font-medium text-gray-600">
              Business Overview
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <TrendingUp size={16} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Business Overview
            </h2>

            <p className="text-xs text-gray-500">
              Key company performance metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Total Employees"
            value={cards.totalEmployees}
            icon={Users}
          />

          <StatCard
            label="Sales Team"
            value={cards.salesEmployees}
            icon={UserCheck}
            color="blue"
          />

          <StatCard
            label="Developers"
            value={cards.developers}
            icon={Code2}
            color="purple"
          />

          <StatCard
            label="Total Clients"
            value={cards.totalClients}
            icon={UserCircle}
            color="green"
          />

          <StatCard
            label="Active Projects"
            value={cards.activeProjects}
            icon={FolderKanban}
            color="yellow"
          />

          <StatCard
            label="Completed"
            value={cards.completedProjects}
            icon={CheckCircle2}
            color="green"
          />

          <StatCard
            label="Total Revenue"
            value={formatCurrency(cards.totalRevenue)}
            icon={TrendingUp}
            color="primary"
          />

          <StatCard
            label="Received"
            value={formatCurrency(cards.totalReceived)}
            icon={Wallet}
            color="green"
          />

          <StatCard
            label="Pending"
            value={formatCurrency(cards.totalPending)}
            icon={Clock}
            color="red"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <BarChart3 size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Monthly Revenue
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Revenue performance by month
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.monthlyRevenue}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    }}
                  />

                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Project Status */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <PieChartIcon size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Project Status Distribution
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Current distribution of project statuses
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.projectStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {charts.projectStatus.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

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
                Current employee attendance overview
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Present"
              value={attendance.present}
              color="green"
            />

            <StatCard
              label="Absent"
              value={attendance.absent}
              color="red"
            />

            <StatCard
              label="On Leave"
              value={attendance.onLeave}
              color="yellow"
            />

            <StatCard
              label="Currently Online"
              value={attendance.currentlyOnline}
              color="blue"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}