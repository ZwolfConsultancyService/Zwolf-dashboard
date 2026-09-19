import { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  UserRound,
  IndianRupee,
  CalendarDays,
  ReceiptText,
  Wallet,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function SalesPayments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/payments', {
        params: {
          page,
          limit: 10,
        },
      });

      setPayments(data.data);
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CreditCard size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                Sales Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Payments
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View and track payment transactions from your clients
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <Wallet size={16} className="text-green-600" />

            <span className="text-sm font-medium text-gray-600">
              {payments.length} Payments
            </span>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <ReceiptText size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Payment Records
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Recent payment transactions and client details
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto p-5">
          <Table
            loading={loading}
            data={payments}
            columns={[
              {
                header: 'Client',
                render: (r) => (
                  <div className="flex min-w-[160px] items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <UserRound size={16} />
                    </div>

                    <span className="font-semibold text-gray-900">
                      {r.client?.clientName || '—'}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Amount',
                render: (r) => (
                  <div className="flex min-w-[130px] items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <IndianRupee size={15} />
                    </div>

                    <span className="font-semibold text-green-600">
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Method',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-gray-400" />

                    <Badge>
                      {r.paymentMethod}
                    </Badge>
                  </div>
                ),
              },

              {
                header: 'Date',
                render: (r) => (
                  <div className="flex min-w-[130px] items-center gap-2">
                    <CalendarDays
                      size={15}
                      className="text-gray-400"
                    />

                    <span className="text-sm text-gray-700">
                      {formatDate(r.paymentDate)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Transaction',
                render: (r) => (
                  <div className="flex min-w-[180px] items-center gap-2">
                    <ReceiptText
                      size={15}
                      className="shrink-0 text-gray-400"
                    />

                    <span className="truncate text-sm text-gray-700">
                      {r.transactionId || '—'}
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