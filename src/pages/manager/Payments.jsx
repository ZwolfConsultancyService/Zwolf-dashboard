import { useEffect, useState, useCallback } from 'react';
import {
  CreditCard,
  UserRound,
  FolderKanban,
  IndianRupee,
  CalendarDays,
  WalletCards,
  UserCheck,
  Trash2,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

export default function ManagerPayments() {
  const { success, error: toastError } = useToast();

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

  /* =========================================================
     🆕 DELETE PAYMENT
  ========================================================= */

  const removePayment = async (payment) => {
    if (
      !confirm(
        `Delete payment of ${formatCurrency(
          payment.amount
        )} from "${payment.client?.clientName || 'client'}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/payments/${payment._id}`);
      success('Payment deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete payment'
      );
    }
  };

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
                Manager Panel
              </p>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Payments
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Monitor client payments and transaction records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5">
            <WalletCards size={16} className="text-green-600" />

            <span className="text-sm font-medium text-gray-600">
              {payments.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* Payment Records */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <WalletCards size={18} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Payment Records
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Client payment history and transaction details
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
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <UserRound size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">
                        {r.client?.clientName || '—'}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Client
                      </p>
                    </div>
                  </div>
                ),
              },

              {
                header: 'Project',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <FolderKanban size={15} />
                    </div>

                    <span className="max-w-[220px] truncate text-sm font-medium text-gray-700">
                      {r.project?.projectName || '—'}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Amount',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <IndianRupee size={15} />
                    </div>

                    <span className="font-bold text-green-600">
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                ),
              },

              {
                header: 'Method',
                render: (r) => (
                  <Badge>
                    {r.paymentMethod}
                  </Badge>
                ),
              },

              {
                header: 'Date',
                render: (r) => (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CalendarDays
                      size={15}
                      className="text-gray-400"
                    />

                    {formatDate(r.paymentDate)}
                  </div>
                ),
              },

              {
                header: 'Added By',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <UserCheck size={15} />
                    </div>

                    <span className="text-sm font-medium text-gray-700">
                      {r.createdBy?.name || '—'}
                    </span>
                  </div>
                ),
              },

              /* 🆕 DELETE ACTION */
              {
                header: 'Actions',
                className: 'text-right',
                render: (r) => (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePayment(r)}
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        border-red-200
                        bg-red-50
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-red-600
                        transition-all
                        duration-200
                        hover:border-red-300
                        hover:bg-red-100
                        hover:text-red-700
                        focus:outline-none
                        focus:ring-2
                        focus:ring-red-500/20
                      "
                      title="Delete payment"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
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