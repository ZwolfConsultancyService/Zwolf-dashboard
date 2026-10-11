import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Layers,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import Loader from '../../components/ui/Loader.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatDate } from '../../utils/format.js';

export default function ClientProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(
          `/client-portal/proposals/${id}`
        );
        setProposal(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loader text="Loading proposal..." />;

  if (!proposal) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
        <FileText size={40} className="mx-auto text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          Proposal not found
        </p>
        <Button
          onClick={() => navigate('/client/proposals')}
          className="mt-4 rounded-lg"
        >
          <ArrowLeft size={14} />
          Back to Proposals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <button
        onClick={() => navigate('/client/proposals')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Proposals
      </button>

      {/* HEADER */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">
                {proposal.proposalNumber}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                Approved
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {proposal.projectName}
            </h1>

            {proposal.createdBy && (
              <p className="mt-1 text-sm text-slate-500">
                From: {proposal.createdBy.name} (
                {proposal.createdBy.role})
              </p>
            )}
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Total Amount
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              ₹
              {Number(
                proposal.totalAmount || 0
              ).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoBox
            label="Approved On"
            value={
              proposal.approvedAt
                ? formatDate(proposal.approvedAt)
                : '—'
            }
          />
          <InfoBox
            label="Valid Until"
            value={
              proposal.validUntil
                ? formatDate(proposal.validUntil)
                : '—'
            }
          />
          <InfoBox
            label="Start Date"
            value={
              proposal.startDate
                ? formatDate(proposal.startDate)
                : '—'
            }
          />
          <InfoBox
            label="End Date"
            value={
              proposal.endDate
                ? formatDate(proposal.endDate)
                : '—'
            }
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      {proposal.description && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Project Description
              </h2>
            </div>
          </div>
          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {proposal.description}
            </p>
          </div>
        </Card>
      )}

      {/* SCOPE */}
      {proposal.scopeOfWork?.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ListChecks
                size={15}
                className="text-slate-500"
              />
              <h2 className="text-sm font-semibold text-slate-900">
                Scope of Work
              </h2>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {proposal.scopeOfWork.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50 p-3"
                >
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <span className="text-sm text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* TECHNOLOGIES */}
      {proposal.technologies?.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                Technologies
              </h2>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {proposal.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="rounded-md border border-purple-100 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* PAYMENT TERMS */}
      {proposal.paymentTerms && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <IndianRupee
                size={15}
                className="text-slate-500"
              />
              <h2 className="text-sm font-semibold text-slate-900">
                Payment Terms
              </h2>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-700">
              {proposal.paymentTerms}
            </p>
          </div>
        </Card>
      )}

      {/* T&C */}
      {proposal.termsAndConditions?.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={15}
                className="text-slate-500"
              />
              <h2 className="text-sm font-semibold text-slate-900">
                Terms & Conditions
              </h2>
            </div>
          </div>
          <div className="p-5">
            <ol className="space-y-2 pl-5 text-sm text-slate-700 list-decimal">
              {proposal.termsAndConditions.map(
                (term, i) => (
                  <li key={i}>{term}</li>
                )
              )}
            </ol>
          </div>
        </Card>
      )}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}