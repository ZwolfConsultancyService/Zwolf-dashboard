import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  MapPin,
  X,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  Loader2,
  Pencil,
  Users,
  Trash2, // 🆕 DELETE ICON
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Loader from '../../components/ui/Loader.jsx';
import Badge from '../../components/ui/Badge.jsx';

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEETING_TYPES = ['Doctor', 'Hospital', 'Pharmacy', 'Clinic', 'Diagnostic', 'Other'];
const DURATIONS = [15, 30, 45, 60, 90];

const MEETING_TYPE_COLORS = {
  Doctor: 'bg-blue-100 text-blue-700 border-blue-200',
  Hospital: 'bg-purple-100 text-purple-700 border-purple-200',
  Pharmacy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Clinic: 'bg-amber-100 text-amber-700 border-amber-200',
  Diagnostic: 'bg-pink-100 text-pink-700 border-pink-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};
const STATUS_COLORS = {
  Scheduled: 'blue',
  Completed: 'green',
  Cancelled: 'red',
  NoShow: 'orange',
};

const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const getSalesId = (sp) => (typeof sp === 'object' ? sp?._id : sp);

/* =========================================================
   MAIN
========================================================= */

export default function SalesMeetings() {
  const { user } = useAuth();
  const { error: toastError, success } = useToast();

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const [byDate, setByDate] = useState({});
  const [loading, setLoading] = useState(true);

  // View: 'mine' | 'team'
  const [view, setView] = useState('mine');

  // Day modal
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayMeetings, setDayMeetings] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);

  /* ---------------- LOAD CALENDAR ---------------- */
  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings/calendar', {
        params: { year: calYear, month: calMonth + 1 },
      });
      setByDate(res.data.data.byDate || {});
    } catch (err) {
      console.error(err);
      toastError('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [calMonth, calYear, toastError]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  /* ---------------- CALENDAR GRID (filtered by view) ---------------- */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) days.push({ empty: true, key: `e-${i}` });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const key = dateKey(date);

      let meetings = (byDate[key] || []).slice();

      // Filter by view
      if (view === 'mine') {
        meetings = meetings.filter(
          (m) => String(getSalesId(m.salesPerson)) === String(user?._id)
        );
      } else {
        meetings = meetings.filter(
          (m) => String(getSalesId(m.salesPerson)) !== String(user?._id)
        );
      }

      meetings.sort((a, b) => a.startMinutes - b.startMinutes);

      days.push({
        key,
        day: d,
        date,
        isToday: isSameDay(date, new Date()),
        isSunday: date.getDay() === 0,
        meetings,
      });
    }
    return days;
  }, [calYear, calMonth, byDate, view, user?._id]);

  /* ---------------- DAY MODAL ---------------- */
  const openDay = async (dayObj) => {
    if (dayObj.empty) return;
    setSelectedDate(dayObj);
    setDayLoading(true);
    try {
      const res = await api.get('/meetings', {
        params: {
          startDate: dateKey(dayObj.date),
          endDate: dateKey(dayObj.date),
          limit: 100,
        },
      });
      let list = res.data.data || [];

      // Filter by view
      if (view === 'mine') {
        list = list.filter(
          (m) => String(getSalesId(m.salesPerson)) === String(user?._id)
        );
      } else {
        list = list.filter(
          (m) => String(getSalesId(m.salesPerson)) !== String(user?._id)
        );
      }

      list.sort((a, b) => a.startMinutes - b.startMinutes);
      setDayMeetings(list);
    } catch (err) {
      console.error(err);
      setDayMeetings([]);
    } finally {
      setDayLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
    setDayMeetings([]);
  };

  /* ---------------- MONTH NAV ---------------- */
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };
  const goToday = () => {
    setCalMonth(new Date().getMonth());
    setCalYear(new Date().getFullYear());
  };

  /* ---------------- STATS ---------------- */
  const monthStats = useMemo(() => {
    let mine = 0, team = 0, myScheduled = 0, myCompleted = 0;
    Object.values(byDate).forEach((list) => {
      list.forEach((m) => {
        const isMine = String(getSalesId(m.salesPerson)) === String(user?._id);
        if (isMine) {
          mine++;
          if (m.status === 'Scheduled') myScheduled++;
          else if (m.status === 'Completed') myCompleted++;
        } else {
          team++;
        }
      });
    });
    return { mine, team, myScheduled, myCompleted };
  }, [byDate, user?._id]);

  if (loading && Object.keys(byDate).length === 0) {
    return <Loader text="Loading meetings..." />;
  }

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="space-y-5 pb-8">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Meetings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Apni meetings manage karo, team ki availability dekho
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={15} />
          New Meeting
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="My Meetings" value={monthStats.mine} icon={<User size={16} />} color="blue" />
        <StatCard label="Team Meetings" value={monthStats.team} icon={<Users size={16} />} color="slate" />
        <StatCard label="My Scheduled" value={monthStats.myScheduled} icon={<Clock size={16} />} color="amber" />
        <StatCard label="My Completed" value={monthStats.myCompleted} icon={<CheckCircle2 size={16} />} color="green" />
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setView('mine')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
            view === 'mine' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <User size={15} /> My Meetings
        </button>
        <button
          onClick={() => setView('team')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
            view === 'team' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={15} /> Team Meetings
        </button>
      </div>

      {/* MONTH NAV */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <button onClick={prevMonth} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <ChevronLeft size={15} /> Prev
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">{MONTHS[calMonth]} {calYear}</h2>
          <button onClick={goToday} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Today</button>
        </div>
        <button onClick={nextMonth} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          Next <ChevronRight size={15} />
        </button>
      </div>

      {/* CALENDAR */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((d) => {
              if (d.empty) return <div key={d.key} className="h-24" />;
              const count = d.meetings.length;
              const preview = d.meetings.slice(0, 3);
              return (
                <button
                  key={d.key}
                  onClick={() => openDay(d)}
                  className={`group relative flex h-24 flex-col items-stretch gap-1 rounded-md border p-1.5 text-left transition ${
                    d.isToday ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400' : d.isSunday ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-semibold leading-none ${d.isToday ? 'text-blue-700' : d.isSunday ? 'text-slate-400' : 'text-slate-700'}`}>{d.day}</span>
                    {count > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white leading-none ${view === 'mine' ? 'bg-blue-600' : 'bg-slate-500'}`}>{count}</span>
                    )}
                  </div>
                  <div className="mt-0.5 space-y-0.5 overflow-hidden">
                    {preview.map((m) => (
                      <div
                        key={m._id}
                        className={`truncate rounded px-1 py-0.5 text-[9px] font-medium border ${
                          view === 'mine' ? MEETING_TYPE_COLORS[m.meetingType] || MEETING_TYPE_COLORS.Other : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {m.startTime} · {view === 'mine' ? (m.client?.clientName || m.clientName) : `${m.salesPerson?.name?.split(' ')[0] || 'Team'}`}
                      </div>
                    ))}
                    {count > 3 && <p className="text-[9px] font-medium text-slate-400">+{count - 3} more</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DAY MODAL */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={closeModal}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedDate.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-500">{view === 'mine' ? 'My meetings' : 'Team meetings'} · {dayMeetings.length} meeting{dayMeetings.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={closeModal} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {dayLoading ? (
                <div className="py-10"><Loader text="Loading..." /></div>
              ) : dayMeetings.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays size={36} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">{view === 'mine' ? 'Is din aapki koi meeting nahi hai' : 'Is din team ki koi meeting nahi hai'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayMeetings.map((m) => (
                    <MeetingRow
                      key={m._id}
                      meeting={m}
                      currentUserId={user?._id}
                      editable={view === 'mine'}
                      onRefresh={() => { openDay(selectedDate); loadCalendar(); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {createOpen && (
        <CreateMeetingModal
          defaultDate={selectedDate?.date || null}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            success('Meeting scheduled successfully');
            loadCalendar();
            if (selectedDate) openDay(selectedDate);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   MEETING ROW
========================================================= */

function MeetingRow({ meeting: m, currentUserId, editable, onRefresh }) {
  const { error: toastError, success } = useToast();
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState(null); // 'cancel' | 'reschedule' | 'delete'
  const [cancelReason, setCancelReason] = useState('');

  const isMine = String(getSalesId(m.salesPerson)) === String(currentUserId);
  const canEdit = editable && isMine && m.status === 'Scheduled';
  const canDelete = editable && isMine; // 🆕 Delete allowed for any own meeting

  const updateStatus = async (status, reason = '') => {
    setBusy(true);
    try {
      await api.patch(`/meetings/${m._id}/status`, { status, cancelReason: reason });
      success(`Meeting ${status.toLowerCase()}`);
      setAction(null);
      setCancelReason('');
      onRefresh?.();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update');
    } finally {
      setBusy(false);
    }
  };

  // 🆕 DELETE FUNCTION
  const deleteMeeting = async () => {
    setBusy(true);
    try {
      await api.delete(`/meetings/${m._id}`);
      success('Meeting deleted successfully');
      setAction(null);
      onRefresh?.();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-md border p-3.5 shadow-sm ${editable ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2">
        {editable ? (
          <span className="rounded bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">My Meeting</span>
        ) : (
          <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-600">{m.salesPerson?.name || 'Team'}</span>
        )}
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${MEETING_TYPE_COLORS[m.meetingType] || MEETING_TYPE_COLORS.Other}`}>
          {m.meetingType}
        </span>
        <Badge color={STATUS_COLORS[m.status] || 'slate'}>{m.status}</Badge>
      </div>

      <h4 className="mt-2 text-sm font-semibold text-slate-900">{m.client?.clientName || m.clientName || 'Client'}</h4>
      {m.client?.companyName && <p className="text-xs text-slate-500">{m.client.companyName}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-400" />
          <span className="font-medium">{m.startTime} – {m.endTime}</span>
          <span className="text-slate-400">({m.duration} min)</span>
        </div>
        {m.clientPhone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /><span>{m.clientPhone}</span></div>}
        {m.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /><span>{m.location}</span></div>}
      </div>

      {/* 🆕 PARTICIPANTS LIST */}
      {m.participants?.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1">With:</span>
          {m.participants.map((p) => (
            <span key={p._id || p} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              <User size={10} className="text-slate-400" />
              {p.name || 'Team Member'}
            </span>
          ))}
        </div>
      )}

      {m.purpose && <p className="mt-2 rounded bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600"><span className="font-semibold">Purpose:</span> {m.purpose}</p>}
      {m.notes && <p className="mt-1 text-[11px] italic text-slate-500">{m.notes}</p>}

      {m.status === 'Cancelled' && m.cancelReason && (
        <p className="mt-1 rounded bg-red-50 px-2 py-1.5 text-[11px] text-red-700"><span className="font-semibold">Cancelled:</span> {m.cancelReason}</p>
      )}

      {/* Actions */}
      {(canEdit || canDelete) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {canEdit && (
            <>
              <button onClick={() => setAction('reschedule')} className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50">
                <Pencil size={12} /> Reschedule
              </button>
              <button onClick={() => updateStatus('Completed')} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50">
                <CheckCircle2 size={12} /> Complete
              </button>
              <button onClick={() => updateStatus('NoShow')} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50">
                <XCircle size={12} /> No Show
              </button>
              <button onClick={() => setAction('cancel')} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
                <X size={12} /> Cancel
              </button>
            </>
          )}
          {/* 🆕 DELETE BUTTON */}
          {canDelete && (
            <button onClick={() => setAction('delete')} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      )}

      {/* Reschedule modal */}
      {action === 'reschedule' && (
        <RescheduleModal meeting={m} onClose={() => setAction(null)} onSaved={() => { setAction(null); onRefresh?.(); }} />
      )}

      {/* Cancel modal */}
      {action === 'cancel' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setAction(null)}>
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3.5"><h3 className="text-base font-semibold text-slate-900">Cancel Meeting?</h3></div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600"><strong>{m.client?.clientName}</strong> ki meeting <strong>{m.startTime} – {m.endTime}</strong> cancel ho jayegi.</p>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Reason (optional)</label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={2} placeholder="e.g. Client unavailable" className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button onClick={() => setAction(null)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Keep it</button>
              <button onClick={() => updateStatus('Cancelled', cancelReason)} disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">{busy ? 'Cancelling...' : 'Yes, Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 DELETE CONFIRM MODAL */}
      {action === 'delete' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setAction(null)}>
          <div className="w-full max-w-sm rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-base font-semibold text-slate-900 text-red-600">Delete Meeting?</h3>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-600">
                Kya aap pakka <strong>{m.client?.clientName}</strong> ki ye meeting <strong>({m.startTime} – {m.endTime})</strong> delete karna chahte hain? Ye wapas nahi aayegi.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button onClick={() => setAction(null)} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">No, Keep it</button>
              <button onClick={deleteMeeting} disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {busy ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RESCHEDULE MODAL
========================================================= */

function RescheduleModal({ meeting, onClose, onSaved }) {
  const { error: toastError, success } = useToast();

  const [form, setForm] = useState({
    date: dateKey(meeting.date),
    startTime: meeting.startTime,
    duration: meeting.duration,
    purpose: meeting.purpose || '',
    location: meeting.location || '',
    notes: meeting.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [teamBusy, setTeamBusy] = useState([]);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!form.date || !form.startTime || !form.duration) return;
    let alive = true;
    const t = setTimeout(async () => {
      const sameDate = form.date === dateKey(meeting.date);
      const sameTime = form.startTime === meeting.startTime;
      const sameDur = Number(form.duration) === Number(meeting.duration);
      if (sameDate && sameTime && sameDur) {
        setConflict(null); setTeamBusy([]); setSuggestedSlots([]); return;
      }
      setChecking(true);
      try {
        const res = await api.get('/meetings/check-conflict', {
          params: { date: form.date, startTime: form.startTime, duration: form.duration, excludeId: meeting._id },
        });
        if (!alive) return;
        const d = res.data.data;
        setConflict(d.hasConflict ? d.conflicts : null);
        setTeamBusy(d.teamBusy || []);
        setSuggestedSlots(d.suggestedSlots || []);
      } catch {
        if (alive) { setConflict(null); setTeamBusy([]); setSuggestedSlots([]); }
      } finally {
        if (alive) setChecking(false);
      }
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [form.date, form.startTime, form.duration, meeting]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (conflict) return toastError('Time slot not available');
    setSaving(true);
    try {
      await api.put(`/meetings/${meeting._id}`, {
        date: form.date, startTime: form.startTime, duration: Number(form.duration),
        purpose: form.purpose, location: form.location, notes: form.notes,
      });
      success('Meeting rescheduled');
      onSaved?.();
    } catch (err) {
      const data = err.response?.data;
      if (data?.suggestedSlots) setSuggestedSlots(data.suggestedSlots);
      if (data?.conflicts) setConflict(data.conflicts);
      toastError(data?.message || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  };

  const applySlot = (slot) => {
    setField('startTime', slot);
    setSuggestedSlots([]);
    setConflict(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Reschedule Meeting</h3>
            <p className="text-xs text-slate-500">{meeting.client?.clientName || meeting.clientName}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <span className="font-semibold">Current:</span> {new Date(meeting.date).toLocaleDateString('en-IN')} · {meeting.startTime} – {meeting.endTime} ({meeting.duration} min)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="New Date *">
              <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </Field>
            <Field label="New Start Time *">
              <input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </Field>
          </div>
          <Field label="Duration">
            <select value={form.duration} onChange={(e) => setField('duration', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </Field>
          {checking && <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" />Checking availability...</div>}
          {!checking && conflict && conflict.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">Ye slot available nahi hai</p>
                  <ul className="mt-1.5 space-y-1">
                    {conflict.map((c) => <li key={c._id} className="text-xs text-red-700">{c.startTime} – {c.endTime} · <strong>{c.clientName}</strong></li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
          {!checking && teamBusy.length > 0 && (!conflict || conflict.length === 0) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">Team busy hai us time:</p>
              <ul className="mt-1 space-y-1">
                {teamBusy.map((t) => <li key={t._id} className="text-xs text-amber-700">{t.startTime} – {t.endTime} · <strong>{t.salesPersonName}</strong></li>)}
              </ul>
            </div>
          )}
          {!checking && suggestedSlots.length > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-800">✅ Ye slots available hain:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSlots.map((slot) => (
                  <button key={slot} type="button" onClick={() => applySlot(slot)} className="rounded-md border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">{slot}</button>
                ))}
              </div>
            </div>
          )}
          <Field label="Purpose">
            <input type="text" value={form.purpose} onChange={(e) => setField('purpose', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </Field>
          <Field label="Location">
            <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </Field>
        </form>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !!conflict || checking} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CREATE MODAL (With Participants)
========================================================= */

function CreateMeetingModal({ defaultDate, onClose, onCreated }) {
  const { error: toastError } = useToast();

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]); // 🆕 Team members
  const [clientsLoading, setClientsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const [form, setForm] = useState({
    client: '',
    meetingType: 'Doctor',
    date: defaultDate ? dateKey(defaultDate) : dateKey(new Date()),
    startTime: '10:00',
    duration: 30,
    purpose: '',
    notes: '',
    location: '',
    participants: [], // 🆕 Participants
  });

  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [teamBusy, setTeamBusy] = useState([]);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [checking, setChecking] = useState(false);

  // Load Clients
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/clients', { params: { limit: 500 } });
        setClients(res.data.data || []);
      } catch { toastError('Failed to load clients'); } finally { setClientsLoading(false); }
    })();
  }, [toastError]);

  // 🆕 Load Users (Employees)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/employees', { params: { limit: 200 } });
        setUsers(res.data.data || []);
      } catch { toastError('Failed to load team members'); } finally { setUsersLoading(false); }
    })();
  }, [toastError]);

  // Conflict check
  useEffect(() => {
    if (!form.date || !form.startTime || !form.duration) return;
    let alive = true;
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get('/meetings/check-conflict', {
          params: { date: form.date, startTime: form.startTime, duration: form.duration },
        });
        if (!alive) return;
        const d = res.data.data;
        setConflict(d.hasConflict ? d.conflicts : null);
        setTeamBusy(d.teamBusy || []);
        setSuggestedSlots(d.suggestedSlots || []);
      } catch {
        if (alive) { setConflict(null); setTeamBusy([]); setSuggestedSlots([]); }
      } finally {
        if (alive) setChecking(false);
      }
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [form.date, form.startTime, form.duration]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.client) return toastError('Please select a client');
    if (conflict) return toastError('Time slot not available');

    setSaving(true);
    try {
      await api.post('/meetings', {
        client: form.client,
        meetingType: form.meetingType,
        date: form.date,
        startTime: form.startTime,
        duration: Number(form.duration),
        purpose: form.purpose,
        notes: form.notes,
        location: form.location,
        participants: form.participants, // 🆕 Pass participants
      });
      onCreated();
    } catch (err) {
      const data = err.response?.data;
      if (data?.suggestedSlots) setSuggestedSlots(data.suggestedSlots);
      if (data?.conflicts) setConflict(data.conflicts);
      toastError(data?.message || 'Failed to schedule meeting');
    } finally {
      setSaving(false);
    }
  };

  const applySlot = (slot) => {
    setField('startTime', slot);
    setSuggestedSlots([]);
    setConflict(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-base font-semibold text-slate-900">Schedule New Meeting</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Client *">
            <select value={form.client} onChange={(e) => setField('client', e.target.value)} required className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">{clientsLoading ? 'Loading clients...' : 'Select client'}</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.clientName}{c.companyName ? ` — ${c.companyName}` : ''}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Meeting Type">
              <select value={form.meetingType} onChange={(e) => setField('meetingType', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {MEETING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Duration">
              <select value={form.duration} onChange={(e) => setField('duration', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *">
              <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </Field>
            <Field label="Start Time *">
              <input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </Field>
          </div>

          {checking && <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" />Checking availability...</div>}

          {!checking && conflict && conflict.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">Ye time slot aapke liye available nahi hai</p>
                  <ul className="mt-1.5 space-y-1">
                    {conflict.map((c) => <li key={c._id} className="text-xs text-red-700">{c.startTime} – {c.endTime} · <strong>{c.clientName}</strong> ({c.meetingType})</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!checking && teamBusy.length > 0 && (!conflict || conflict.length === 0) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Is time pe team busy hai</p>
                  <ul className="mt-1.5 space-y-1">
                    {teamBusy.map((t) => <li key={t._id} className="text-xs text-amber-700">{t.startTime} – {t.endTime} · <strong>{t.salesPersonName}</strong></li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!checking && suggestedSlots.length > 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-800">✅ Ye slots available hain — click karo:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSlots.map((slot) => (
                  <button key={slot} type="button" onClick={() => applySlot(slot)} className="rounded-md border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">{slot}</button>
                ))}
              </div>
            </div>
          )}

          {/* 🆕 Participants Field */}
          <Field label="Participants">
            <select
              multiple
              value={form.participants}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                setField('participants', selected);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              size={4}
            >
              {usersLoading ? (
                <option disabled>Loading members...</option>
              ) : (
                users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)
              )}
            </select>
            <p className="mt-1 text-[10px] text-slate-500">Hold <strong>Ctrl</strong> (Windows) or <strong>Cmd</strong> (Mac) to select multiple</p>
          </Field>

          <Field label="Purpose">
            <input type="text" value={form.purpose} onChange={(e) => setField('purpose', e.target.value)} placeholder="e.g. Product demo, follow-up" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </Field>

          <Field label="Location">
            <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="e.g. Clinic address, Google Meet" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} placeholder="Optional notes..." className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </Field>
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || !!conflict || checking} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" />Scheduling...</> : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`rounded-md p-1 border ${colors[color]}`}>{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}