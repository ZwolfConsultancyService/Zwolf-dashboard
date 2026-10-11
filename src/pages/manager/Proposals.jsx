import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  CheckCircle2,
  Trash2,
  Eye,
  Edit3,
  Clock,
  Filter,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

export default function ManagerProposals() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;

      const { data } = await api.get('/proposals', { params });

      setProposals(data.data || []);
      setPagination(data.pagination || null);
      setStats(data.stats || null);
    } catch (err) {
      toastError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [page, status, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const approveProposal = async (proposal) => {
    if (
      !confirm(
        `Approve proposal "${proposal.projectName}"?\n\nAfter approval, this will be visible to the client.`
      )
    )
      return;

    try {
      await api.patch(`/proposals/${proposal._id}/approve`);
      success('Proposal approved — visible to client');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to approve'
      );
    }
  };

  const remove = async (proposal) => {
    if (
      !confirm(
        `Delete proposal "${proposal.projectName}"?\n\nThis cannot be undone.`
      )
    )
      return;

    try {
      await api.delete(`/proposals/${proposal._id}`);
      success('Proposal deleted');
      load();
    } catch (err) {
      toastError('Failed to delete');
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText size={21} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Proposals
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Create, approve and manage client proposals
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/manager/proposals/new')}
          className="rounded-lg bg-blue-600 font-semibold hover:bg-blue-700"
        >
          <Plus size={16} />
          New Proposal
        </Button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={Clock}
            label="Draft"
            value={stats.draft}
            color="slate"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
            color="emerald"
          />
          <StatCard
            icon={FileText}
            label="Total"
            value={(stats.draft || 0) + (stats.approved || 0)}
            color="blue"
          />
        </div>
      )}

      {/* LIST */}
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              All Proposals
            </h2>
          </div>

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Approved">Approved</option>
          </Select>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : proposals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <FileText
                size={32}
                className="mx-auto text-slate-300"
              />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No proposals yet
              </p>
              <Button
                size="sm"
                onClick={() => navigate('/manager/proposals/new')}
                className="mt-4 rounded-lg bg-blue-600 font-semibold hover:bg-blue-700"
              >
                <Plus size={14} />
                New Proposal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <ProposalCard
                  key={p._id}
                  proposal={p}
                  onView={() =>
                    navigate(`/manager/proposals/${p._id}`)
                  }
                  onEdit={() =>
                    navigate(`/manager/proposals/${p._id}/edit`)
                  }
                  onApprove={() => approveProposal(p)}
                  onDelete={() => remove(p)}
                />
              ))}
            </div>
          )}

          {pagination && (
            <div className="mt-5 border-t border-slate-100 pt-5">
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

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}
        >
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">
            {value || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  onView,
  onEdit,
  onApprove,
  onDelete,
}) {
  const isApproved = proposal.status === 'Approved';

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md ${
        isApproved
          ? 'border-emerald-200'
          : 'border-slate-200'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              {proposal.proposalNumber}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              {proposal.status}
            </span>
          </div>

          <h3 className="mt-2 text-base font-semibold text-slate-900">
            {proposal.projectName}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {proposal.client?.companyName ||
              proposal.client?.clientName ||
              'Client'}
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="font-bold text-emerald-600">
              ₹
              {Number(
                proposal.totalAmount || 0
              ).toLocaleString('en-IN')}
            </span>
            {proposal.approvedAt && (
              <span>
                Approved: {formatDate(proposal.approvedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onView}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Eye size={13} />
            View
          </button>

          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            <Edit3 size={13} />
            Edit
          </button>

          {!isApproved && (
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <CheckCircle2 size={13} />
              Approve
            </button>
          )}

          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}