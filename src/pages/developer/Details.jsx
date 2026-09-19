import { useEffect, useState } from 'react';
import {
  FileText,
  UserRound,
  CalendarDays,
  Copy,
  Check,
  FolderKanban,
} from 'lucide-react';

import api from '../../api/axios.js';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDateTime } from '../../utils/format.js';
import Badge from '../../components/ui/Badge.jsx';

export default function DeveloperDetails() {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    api
      .get('/details', { params: { limit: 100 } })
      .then((res) => setDetails(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text || '');

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy details:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Details
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manager ki taraf se full details aur instructions
              </p>
            </div>
          </div>
        </div>

        {!loading && details.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <p className="text-xs font-medium text-gray-400">
              Total Details
            </p>

            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {details.length}
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <Card>
        <div className="p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader />
            </div>
          ) : details.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No details yet"
                message="Manager ne abhi tak koi detail nahi bheja"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {details.map((d) => {
                const isCopied = copiedId === d._id;

                return (
                  <div
                    key={d._id}
                    className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      {/* =================================================
                          ICON
                      ================================================== */}

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        <FileText size={21} />
                      </div>

                      {/* =================================================
                          MAIN CONTENT
                      ================================================== */}

                      <div className="min-w-0 flex-1">
                        {/* Title */}

                        <div className="flex items-start justify-between gap-4">
                          <h3 className="break-words text-lg font-semibold text-gray-900">
                            {d.title}
                          </h3>
                           {d.project && (
    <Badge color="purple">
      <FolderKanban size={12} className="mr-1 inline" />
      {d.project.projectName}
    </Badge>
  )}
                        </div>

                        {/* Divider */}

                        <div className="my-4 h-px bg-gray-100" />

                        {/* =================================================
                            DETAILS / DESCRIPTION
                        ================================================== */}

                        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                          <div className="max-h-64 overflow-y-auto pr-2">
                            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
                              {d.details}
                            </p>
                          </div>
                        </div>

                        {/* =================================================
                            COPY BUTTON
                        ================================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(d._id, d.details)
                          }
                          className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
                            isCopied
                              ? 'border-green-200 bg-green-50 text-green-600'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check size={14} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy Details
                            </>
                          )}
                        </button>

                        {/* =================================================
                            FOOTER
                        ================================================== */}

                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <UserRound
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              By{' '}
                              <span className="font-medium text-gray-700">
                                {d.createdBy?.name || 'Manager'}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CalendarDays
                              size={14}
                              className="text-gray-400"
                            />

                            <span>
                              {formatDateTime(d.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
