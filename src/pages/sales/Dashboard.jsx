import { useEffect, useState } from 'react';
import {
  UserCircle,
  UserPlus,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  TrendingUp,
  Wallet,
  Clock,
  Users,
  CreditCard,
} from 'lucide-react';

import api from '../../api/axios.js';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import Loader from '../../components/ui/Loader.jsx';
import Badge, { statusColor } from '../../components/ui/Badge.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function SalesDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/sales').then((res) => {
      setData(res.data.data);
    });
  }, []);

  if (!data) {
    return <Loader />;
  }

  const { cards, recentClients, recentPayments } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Sales Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Sales Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Track your clients, leads, projects and payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <Users size={16} className="text-blue-600" />

            <span className="text-sm font-medium text-gray-600">
              Sales Overview
            </span>
          </div>
        </div>
      </div>

      {/* Sales Overview */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <TrendingUp size={16} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Sales Overview
            </h2>

            <p className="text-xs text-gray-500">
              Your current sales performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="My Clients"
            value={cards.myClients}
            icon={UserCircle}
          />

          <StatCard
            label="New Leads"
            value={cards.newLeads}
            icon={UserPlus}
            color="blue"
          />

          <StatCard
            label="Follow-ups Today"
            value={cards.followUpsToday}
            icon={CalendarClock}
            color="yellow"
          />

          <StatCard
            label="Confirmed"
            value={cards.confirmedClients}
            icon={CheckCircle2}
            color="green"
          />

          <StatCard
            label="Active Projects"
            value={cards.activeProjects}
            icon={FolderKanban}
            color="purple"
          />

          <StatCard
            label="Sales Value"
            value={formatCurrency(cards.totalSalesValue)}
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Clients */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <UserCircle size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Clients
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Latest clients added to your sales pipeline
                </p>
              </div>
            </div>
          </div>

          <div className="px-5">
            {recentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <UserCircle size={21} />
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No clients yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Your recently added clients will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentClients.map((c) => (
                  <li
                    key={c._id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                        <UserCircle size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {c.clientName}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {c.companyName || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Badge color={statusColor(c.clientStatus)}>
                        {c.clientStatus}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Recent Payments */}
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CreditCard size={18} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Recent Payments
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Latest payments received from clients
                </p>
              </div>
            </div>
          </div>

          <div className="px-5">
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <CreditCard size={21} />
                </div>

                <p className="mt-3 text-sm font-medium text-gray-700">
                  No payments yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Recent payment activity will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentPayments.map((p) => (
                  <li
                    key={p._id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                        <Wallet size={17} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {p.client?.clientName}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{formatDate(p.paymentDate)}</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-green-600">
                      {formatCurrency(p.amount)}
                    </span>
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