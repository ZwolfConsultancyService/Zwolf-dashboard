import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Eye, Filter } from 'lucide-react';
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
    } catch (err) {
      toastError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [page, status, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (proposal) => {
    if (!confirm(`Delete proposal "${proposal.projectName}"?`)) return;
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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText size={21} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Proposals (PDF)</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Manage and view client PDF proposals
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/manager/proposals/new')}
          className="rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Upload PDF
        </Button>
      </div>

      {/* LIST */}
      <Card className="border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-900">All PDFs</h2>
          </div>

          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-40 border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
          >
            <option value="">All Status</option>
            <option value="Approved">Approved</option>
          </Select>
        </div>

        <div className="p-5">
          {loading ? (
            <Loader />
          ) : proposals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <FileText size={32} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">No proposals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <div key={p._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition hover:border-blue-300 hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">{p.proposalNumber}</span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600 border border-emerald-100">Approved</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{p.projectName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Client: {p.client?.clientName} | {formatDate(p.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {p.documentPdf && (
                      <button
                        // 🆕 Naye tab mein open karne ke liye navigate use kiya
                      onClick={() => navigate(`/manager/proposals/${p._id}/view`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Eye size={13} /> View PDF
                      </button>
                    )}
                    <button
                      onClick={() => remove(p)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}