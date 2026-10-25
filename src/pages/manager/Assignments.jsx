import { useEffect, useState, useMemo } from 'react';
import {
  UserCheck, MapPin, Tag, ShieldAlert, Lock,
  ChevronDown, ChevronRight, CheckCircle2, Users,
  TrendingUp, Clock,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Assignments() {
  const { error: toastError } = useToast();
  const [combos, setCombos] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterSalesPerson, setFilterSalesPerson] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'Pending' | 'Done'

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments/all-combos');
      setCombos(res.data.data);

      // Auto expand
      const exp = {};
      res.data.data.forEach((cat) => {
        cat.locations.forEach((loc) => {
          exp[`${cat._id}_${loc._id}`] = true;
        });
      });
      setExpanded(exp);
    } catch {
      toastError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Flat list of taken combos
  const takenList = useMemo(() => {
    const list = [];
    const walk = (cat, loc) => {
      if (!loc.available && loc.takenBy) {
        list.push({
          categoryId: cat._id,
          categoryName: cat.name,
          locationId: loc._id,
          locationName: loc.name,
          salesPerson: loc.takenBy,
          status: loc.takenBy?.status || 'Pending',
          leadStats: loc.leadStats || { today: 0, total: 0 },
        });
      }
      loc.children?.forEach((c) => walk(cat, c));
    };
    combos.forEach((cat) => cat.locations.forEach((loc) => walk(cat, loc)));
    return list;
  }, [combos]);

  // Unique sales persons
  const salesPeople = useMemo(() => {
    const map = new Map();
    takenList.forEach((a) => {
      if (a.salesPerson?._id) {
        map.set(a.salesPerson._id, a.salesPerson);
      }
    });
    return Array.from(map.values());
  }, [takenList]);

  // Filtered list
  const filteredList = useMemo(() => {
    let list = takenList;
    if (filterSalesPerson) {
      list = list.filter((t) => t.salesPerson?._id === filterSalesPerson);
    }
    if (filterStatus) {
      list = list.filter((t) => t.status === filterStatus);
    }
    return list;
  }, [takenList, filterSalesPerson, filterStatus]);

  // 🆕 Stats
  const stats = useMemo(() => {
    const pending = takenList.filter((t) => t.status === 'Pending').length;
    const done = takenList.filter((t) => t.status === 'Done').length;
    const todayLeads = takenList.reduce(
      (sum, t) => sum + (t.leadStats?.today || 0),
      0
    );
    const totalLeads = takenList.reduce(
      (sum, t) => sum + (t.leadStats?.total || 0),
      0
    );
    return { pending, done, todayLeads, totalLeads };
  }, [takenList]);

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const renderLocation = (cat, node, depth = 0) => {
    const hasChildren = node.children?.length > 0;
    const expandKey = `${cat._id}_${node._id}`;
    const isExpanded = expanded[expandKey];
    const status = node.takenBy?.status || 'Pending';
    const leads = node.leadStats || { today: 0, total: 0 };

    return (
      <div key={node._id}>
        <div
          className={`mb-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
            !node.available
              ? 'bg-slate-50 border-slate-200'
              : 'bg-white border-slate-200'
          }`}
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => toggle(expandKey)}
                className="text-slate-400 hover:text-slate-700"
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}
            <MapPin
              size={14}
              className={node.available ? 'text-slate-500' : 'text-red-400'}
            />
            <span className="font-medium text-slate-800">{node.name}</span>

            {!node.available ? (
              <>
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  <Lock size={10} /> {node.takenBy?.name}
                </span>

                {/* 🆕 Status badge */}
                {status === 'Done' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 size={10} /> Done
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Clock size={10} /> Pending
                  </span>
                )}

                {/* 🆕 Lead badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                    leads.today > 0
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  title={`Total: ${leads.total}`}
                >
                  <TrendingUp size={10} /> {leads.today} today
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <CheckCircle2 size={10} /> Available
              </span>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((c) => renderLocation(cat, c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Sales Person Claims
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sales persons khud apni category + location claim karte hain. Yahan aap sirf dekh sakte ho.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Read-Only View</p>
          <p className="mt-0.5">
            Sales persons jab "Claim" button dabate hain to yeh combo unko
            auto-assign ho jata hai. Aap yahan sirf status dekh sakte ho.
          </p>
        </div>
      </div>

      {/* 🆕 Stats row — 5 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sales Persons
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {salesPeople.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Claims
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {takenList.length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Pending
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {stats.pending}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Done
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {stats.done}
          </p>
        </div>
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            Aaj ke Leads
          </p>
          <p className="mt-1 text-2xl font-bold text-purple-700">
            {stats.todayLeads}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-400" />
          <select
            value={filterSalesPerson}
            onChange={(e) => setFilterSalesPerson(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">All Sales Persons</option>
            {salesPeople.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 🆕 Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Done">Done</option>
        </select>

        {(filterSalesPerson || filterStatus) && (
          <button
            onClick={() => {
              setFilterSalesPerson('');
              setFilterStatus('');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* All combos tree */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          All Combos (Live)
        </h2>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : combos.length === 0 ? (
            <p className="text-sm text-slate-500">No categories yet.</p>
          ) : (
            combos.map((cat) => {
              // 🆕 Category lead totals
              let catLeadToday = 0;
              let catLeadTotal = 0;
              const countLeads = (nodes) => {
                nodes.forEach((n) => {
                  catLeadToday += n.leadStats?.today || 0;
                  catLeadTotal += n.leadStats?.total || 0;
                  if (n.children?.length) countLeads(n.children);
                });
              };
              countLeads(cat.locations || []);

              return (
                <div
                  key={cat._id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Tag size={14} className="text-blue-500" />
                    <span className="font-semibold text-slate-900">
                      {cat.name}
                    </span>

                    {/* 🆕 Category lead badge */}
                    {catLeadTotal > 0 && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          catLeadToday > 0
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title={`Total: ${catLeadTotal}`}
                      >
                        🎯 {catLeadToday} today · {catLeadTotal} total
                      </span>
                    )}
                  </div>
                  {cat.locations.length === 0 ? (
                    <p className="text-xs italic text-slate-400">
                      No locations in this category
                    </p>
                  ) : (
                    <div>
                      {cat.locations.map((loc) => renderLocation(cat, loc))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Taken list table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          All Claims ({filteredList.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Claimed By
                </th>
                {/* 🆕 Status column */}
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>
                {/* 🆕 Leads column */}
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Leads
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredList.map((a, i) => (
                <tr key={i} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-blue-500" />
                      <strong className="text-slate-900">
                        {a.categoryName}
                      </strong>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="text-slate-700">{a.locationName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-green-500" />
                      <span className="font-medium text-slate-900">
                        {a.salesPerson?.name}
                      </span>
                    </div>
                  </td>
                  {/* 🆕 Status badge */}
                  <td className="px-4 py-3">
                    {a.status === 'Done' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 size={10} /> Done
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </td>
                  {/* 🆕 Lead counts */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          a.leadStats.today > 0
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {a.leadStats.today} today
                      </span>
                      <span className="text-xs text-slate-500">
                        / {a.leadStats.total} total
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No claims match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}