import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  FolderKanban,
  Search,
  MessageSquare,
  ArrowRight,
  Video,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';

import api from '../../api/axios.js';
import Loader from '../../components/ui/Loader.jsx';
import { formatDateTime } from '../../utils/format.js';

/* =========================================================
   CLIENT REQUESTS PAGE (Sales)
========================================================= */

export default function SalesClientRequests() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  // 'all' | 'project' | 'seo' | 'meeting'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const params = {};
        if (filter !== 'all') {
          params.type = filter;
        }

        const { data } = await api.get('/client-requests', {
          params,
        });

        setRequests(data?.data || []);
      } catch (err) {
        console.error('client requests err:', err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filter]);

  const openChat = (conversationId) => {
    navigate(`/sales/messages?c=${conversationId}`);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Client Requests
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Project, SEO, and Meeting requests from your clients.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Inbox size={16} />
          <span>{requests.length} request(s)</span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <FilterTabs active={filter} onChange={setFilter} />
      </div>

      {/* LIST */}
      {loading ? (
        <Loader text="Loading requests..." />
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Inbox size={40} className="mx-auto text-gray-300" />

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            No requests found
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            When your clients send project, SEO, or meeting
            requests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              onOpen={() => openChat(req.conversationId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FILTER TABS
========================================================= */

function FilterTabs({ active, onChange }) {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'project', label: 'Projects' },
    { key: 'seo', label: 'SEO Plans' },
    { key: 'meeting', label: 'Meetings' },
  ];

  return (
    <div className="flex">
      {tabs.map((tab) => {
        const isActive = active === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`
              relative
              px-4
              py-3
              text-sm
              font-medium
              transition
              ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}

            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   REQUEST CARD
========================================================= */

function RequestCard({ request, onOpen }) {
  const isProject = request.type === 'project';
  const isSeo = request.type === 'seo';
  const isMeeting = request.type === 'meeting';

  /* ---------- ACCENT THEME ---------- */

  let accent;

  if (isProject) {
    accent = {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      label: 'Project Request',
      Icon: FolderKanban,
    };
  } else if (isSeo) {
    accent = {
      border: 'border-l-emerald-500',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      label: 'SEO Plan Request',
      Icon: Search,
    };
  } else if (isMeeting) {
    accent = {
      border: 'border-l-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      label:
        request.meetingType === 'online'
          ? 'Meeting · Online'
          : 'Meeting · Offline',
      Icon: Video,
    };
  } else {
    accent = {
      border: 'border-l-gray-400',
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      label: 'Request',
      Icon: Inbox,
    };
  }

  const Icon = accent.Icon;

  return (
    <div
      className={`
        rounded-xl
        border
        border-gray-200
        border-l-4
        ${accent.border}
        bg-white
        p-5
        shadow-sm
        transition
        hover:shadow-md
      `}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* LEFT */}
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}
          >
            <Icon size={20} />
          </div>

          <div className="min-w-0 flex-1">
            {/* TYPE BADGE */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full ${accent.bg} ${accent.text} px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide`}
              >
                {accent.label}
              </span>

              {!request.readAt && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  New
                </span>
              )}
            </div>

            {/* CLIENT */}
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              {request.client?.companyName ||
                request.client?.clientName ||
                'Unknown Client'}
            </p>

            {/* TITLE */}
            <h3 className="mt-1 text-base font-semibold text-gray-900">
              {request.title || 'Untitled Request'}
            </h3>

            {/* WEBSITE (SEO only) */}
            {isSeo && request.websiteUrl && (
              <p className="mt-1 break-all text-xs text-gray-500">
                🌐 {request.websiteUrl}
              </p>
            )}

            {/* MEETING DETAILS */}
            {isMeeting && (
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                {request.meetingDateTime && (
                  <p className="flex items-center gap-1.5">
                    <Calendar
                      size={12}
                      className="text-gray-400"
                    />
                    <span>{request.meetingDateTime}</span>
                  </p>
                )}

                {request.meetingDuration && (
                  <p className="flex items-center gap-1.5">
                    <Clock
                      size={12}
                      className="text-gray-400"
                    />
                    <span>{request.meetingDuration}</span>
                  </p>
                )}

                {request.meetingType === 'offline' &&
                  request.meetingAddress && (
                    <p className="flex items-start gap-1.5">
                      <MapPin
                        size={12}
                        className="mt-0.5 shrink-0 text-gray-400"
                      />
                      <span className="break-words">
                        {request.meetingAddress}
                      </span>
                    </p>
                  )}

                {request.meetingType === 'online' &&
                  request.meetingLink && (
                    <a
                      href={request.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-100"
                    >
                      <Video size={12} />
                      Join Meeting
                      <ExternalLink size={11} />
                    </a>
                  )}
              </div>
            )}

            {/* DESCRIPTION */}
            {request.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {request.description}
              </p>
            )}

            {/* META */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>📅 {formatDateTime(request.createdAt)}</span>

              {request.budget && <span>💰 {request.budget}</span>}
            </div>
          </div>
        </div>

        {/* RIGHT — ACTION */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          {/* Join Meeting (Online only) */}
          {isMeeting &&
            request.meetingType === 'online' &&
            request.meetingLink && (
              <a
                href={request.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-purple-600
                  px-4
                  py-2
                  text-xs
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-purple-700
                "
              >
                <Video size={14} />
                Join
                <ExternalLink size={11} />
              </a>
            )}

          <button
            type="button"
            onClick={onOpen}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-gray-200
              bg-white
              px-4
              py-2
              text-xs
              font-semibold
              text-gray-700
              shadow-sm
              transition
              hover:border-blue-200
              hover:bg-blue-50
              hover:text-blue-600
            "
          >
            <MessageSquare size={14} />
            Open Chat
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}