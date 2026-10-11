import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';

import api from '../../api/axios.js';
import Loader from '../../components/ui/Loader.jsx';
import { formatDate } from '../../utils/format.js';

export default function ClientProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(
          '/client-portal/proposals',
          { params: { limit: 50 } }
        );
        setProposals(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <Loader text="Loading proposals..." />;

  return (
    <div className="space-y-5 pb-8">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText size={21} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              My Proposals
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              View all proposals shared by our team
            </p>
          </div>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileText
            size={40}
            className="mx-auto text-slate-300"
          />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No proposals yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Proposals shared by our team will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div
              key={p._id}
              onClick={() =>
                navigate(`/client/proposals/${p._id}`)
              }
              className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      {p.proposalNumber}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                      Approved
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                    {p.projectName}
                  </h3>

                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <IndianRupee size={11} />
                      <strong className="text-emerald-600">
                        ₹
                        {Number(
                          p.totalAmount || 0
                        ).toLocaleString('en-IN')}
                      </strong>
                    </span>
                    {p.approvedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(p.approvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm font-semibold text-blue-600">
                  View Details
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-1"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}