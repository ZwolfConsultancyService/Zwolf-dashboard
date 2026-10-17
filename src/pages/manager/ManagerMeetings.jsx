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
  Filter,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Loader from '../../components/ui/Loader.jsx';
import Badge from '../../components/ui/Badge.jsx';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export default function ManagerMeetings() {
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  const [byDate, setByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(null);
  const [dayMeetings, setDayMeetings] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);

  const [salesPersons, setSalesPersons] = useState([]);
  const [salesFilter, setSalesFilter] = useState('');

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const params = { year: calYear, month: calMonth + 1 };
      if (salesFilter) params.salesPerson = salesFilter;
      const res = await api.get('/meetings/calendar', { params });
      setByDate(res.data.data.byDate || {});
    } catch (err) {
      console.error(err);
      toastError('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [calMonth, calYear, salesFilter, toastError]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/employees', { params: { role: 'sales', limit: 200 } });
        if (alive) setSalesPersons(res.data.data || []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startDay; i++) days.push({ empty: true, key: `e-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calYear, calMonth, d);
      const key = dateKey(date);
      const meetings = (byDate[key] || []).slice().sort((a, b) => a.startMinutes - b.startMinutes);
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
  }, [calYear, calMonth, byDate]);

  const openDay = async (dayObj) => {
    if (dayObj.empty) return;
    setSelectedDate(dayObj);
    setDayLoading(true);
    try {
      const params = {
        startDate: dateKey(dayObj.date),
        endDate: dateKey(dayObj.date),
        limit: 100,
      };
      if (salesFilter) params.salesPerson = salesFilter;
      const res = await api.get('/meetings', { params });
      setDayMeetings(res.data.data || []);
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

  const monthStats = useMemo(() => {
    let total = 0, scheduled = 0, completed = 0, cancelled = 0;
    Object.values(byDate).forEach((list) => {
      list.forEach((m) => {
        total++;
        if (m.status === 'Scheduled') scheduled++;
        else if (m.status === 'Completed') completed++;
        else if (m.status === 'Cancelled') cancelled++;
      });
    });
    return { total, scheduled, completed, cancelled };
  }, [byDate]);

  if (loading && Object.keys(byDate).length === 0) {
    return <Loader text="Loading meetings..." />;
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Team Meetings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Poori team ki meetings — date-wise view
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Sales Persons</option>
            {salesPersons.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={monthStats.total} icon={<CalendarIcon size={16} />} color="blue" />
        <StatCard label="Scheduled" value={monthStats.scheduled} icon={<Clock size={16} />} color="amber" />
        <StatCard label="Completed" value={monthStats.completed} icon={<CheckCircle2 size={16} />} color="green" />
        <StatCard label="Cancelled" value={monthStats.cancelled} icon={<XCircle size={16} />} color="red" />
      </div>

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

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {w}
              </div>
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
                  className={`
                    group relative flex h-24 flex-col items-stretch gap-1 rounded-md border p-1.5 text-left transition
                    ${d.isToday
                      ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                      : d.isSunday
                      ? 'border-slate-100 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-semibold leading-none ${
                      d.isToday ? 'text-blue-700' : d.isSunday ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                      {d.day}
                    </span>
                    {count > 0 && (
                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                        {count}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 space-y-0.5 overflow-hidden">
                    {preview.map((m) => (
                      <div
                        key={m._id}
                        className={`truncate rounded px-1 py-0.5 text-[9px] font-medium border ${
                          MEETING_TYPE_COLORS[m.meetingType] || MEETING_TYPE_COLORS.Other
                        }`}
                        title={`${m.startTime} · ${m.client?.clientName} — ${m.salesPerson?.name || ''}`}
                      >
                        {m.startTime} · {m.client?.clientName || m.clientName}
                        {m.salesPerson?.name && (
                          <span className="text-slate-500"> · {m.salesPerson.name.split(' ')[0]}</span>
                        )}
                      </div>
                    ))}
                    {count > 3 && (
                      <p className="text-[9px] font-medium text-slate-400">+{count - 3} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={closeModal}>
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedDate.date.toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </h3>
                <p className="text-xs text-slate-500">
                  {dayMeetings.length} meeting{dayMeetings.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={closeModal} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {dayLoading ? (
                <div className="py-10"><Loader text="Loading..." /></div>
              ) : dayMeetings.length === 0 ? (
                <div className="py-12 text-center">
                  <CalendarDays size={36} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">Is din koi meeting nahi hai</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayMeetings.map((m) => (
                    <ManagerMeetingRow key={m._id} meeting={m} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerMeetingRow({ meeting: m }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
          MEETING_TYPE_COLORS[m.meetingType] || MEETING_TYPE_COLORS.Other
        }`}>
          {m.meetingType}
        </span>
        <Badge color={STATUS_COLORS[m.status] || 'slate'}>{m.status}</Badge>
        {m.salesPerson?.name && (
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            <User size={10} className="mr-1 inline" />
            {m.salesPerson.name}
          </span>
        )}
      </div>

      <h4 className="mt-2 text-sm font-semibold text-slate-900">
        {m.client?.clientName || m.clientName || 'Client'}
      </h4>
      {m.client?.companyName && (
        <p className="text-xs text-slate-500">{m.client.companyName}</p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-400" />
          <span className="font-medium">{m.startTime} – {m.endTime}</span>
          <span className="text-slate-400">({m.duration} min)</span>
        </div>
        {m.clientPhone && (
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="text-slate-400" />
            <span>{m.clientPhone}</span>
          </div>
        )}
        {m.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-slate-400" />
            <span>{m.location}</span>
          </div>
        )}
      </div>

      {m.purpose && (
        <p className="mt-2 rounded bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
          <span className="font-semibold">Purpose:</span> {m.purpose}
        </p>
      )}
      {m.notes && <p className="mt-1 text-[11px] italic text-slate-500">{m.notes}</p>}
    </div>
  );
}

function StatCard({ label, value, icon, color = 'blue' }) {
  const colors = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
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