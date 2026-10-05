import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  MapPin,
  CalendarDays,
  Clock,
  ExternalLink,
  ArrowRight,
  Inbox,
} from 'lucide-react';

import api from '../../api/axios.js';
import Loader from '../../components/ui/Loader.jsx';

/* =========================================================
   MY MEETINGS PAGE (Client)
========================================================= */

export default function MyMeetings() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const { data } = await api.get(
          '/client-requests/my-meetings'
        );

        setMeetings(data?.data || []);
      } catch (err) {
        console.error('my meetings err:', err);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* =========================================================
     SEPARATE ONLINE / OFFLINE
  ========================================================= */

  const onlineMeetings = meetings.filter(
    (m) => m.meetingType === 'online'
  );

  const offlineMeetings = meetings.filter(
    (m) => m.meetingType === 'offline'
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Meetings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            All your scheduled meetings with our team.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Video size={16} />
          <span>{meetings.length} meeting(s)</span>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <Loader text="Loading meetings..." />
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Video size={40} className="mx-auto text-gray-300" />

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            No meetings yet
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            When you send meeting requests, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* =====================================================
             ONLINE MEETINGS
          ===================================================== */}

          {onlineMeetings.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-purple-600">
                <Video size={16} />
                Online Meetings
              </h2>

              <div className="space-y-3">
                {onlineMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    onOpenChat={() =>
                      navigate(
                        `/client/messages?c=${meeting.conversationId}`
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* =====================================================
             OFFLINE MEETINGS
          ===================================================== */}

          {offlineMeetings.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-orange-600">
                <MapPin size={16} />
                Offline Meetings
              </h2>

              <div className="space-y-3">
                {offlineMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    onOpenChat={() =>
                      navigate(
                        `/client/messages?c=${meeting.conversationId}`
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MEETING CARD
========================================================= */

function MeetingCard({ meeting, onOpenChat }) {
  const isOnline = meeting.meetingType === 'online';

  return (
    <div
      className={`
        rounded-xl
        border
        border-gray-200
        border-l-4
        ${isOnline ? 'border-l-purple-500' : 'border-l-orange-500'}
        bg-white
        p-5
        shadow-sm
        transition
        hover:shadow-md
      `}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* LEFT */}
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div
            className={`
              flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
              ${
                isOnline
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-orange-50 text-orange-600'
              }
            `}
          >
            {isOnline ? <Video size={20} /> : <MapPin size={20} />}
          </div>

          <div className="min-w-0 flex-1">
            {/* TYPE BADGE */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`
                  rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide
                  ${
                    isOnline
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-orange-50 text-orange-600'
                  }
                `}
              >
                {isOnline ? 'Online Meeting' : 'Offline Meeting'}
              </span>
            </div>

            {/* TITLE */}
            <h3 className="mt-2 text-base font-semibold text-gray-900">
              {meeting.title || 'Meeting'}
            </h3>

            {/* DATE / DURATION / ADDRESS */}
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              {meeting.meetingDateTime && (
                <p className="flex items-center gap-1.5">
                  <CalendarDays size={12} className="text-gray-400" />
                  <span>{meeting.meetingDateTime}</span>
                </p>
              )}

              {meeting.meetingDuration && (
                <p className="flex items-center gap-1.5">
                  <Clock size={12} className="text-gray-400" />
                  <span>{meeting.meetingDuration}</span>
                </p>
              )}

              {!isOnline && meeting.meetingAddress && (
                <p className="flex items-start gap-1.5">
                  <MapPin
                    size={12}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />
                  <span className="break-words">
                    {meeting.meetingAddress}
                  </span>
                </p>
              )}

              {isOnline && meeting.meetingLink && (
                <p className="break-all text-xs text-gray-500">
                  🔗 {meeting.meetingLink}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            {meeting.description && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {meeting.description}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — ACTIONS */}
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {isOnline && meeting.meetingLink && (
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                items-center
                justify-center
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
              Join Meeting
              <ExternalLink size={11} />
            </a>
          )}

          <button
            type="button"
            onClick={onOpenChat}
            className="
              inline-flex
              items-center
              justify-center
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
              hover:border-purple-200
              hover:bg-purple-50
              hover:text-purple-600
            "
          >
            Open Chat
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}