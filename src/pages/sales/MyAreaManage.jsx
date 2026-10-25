import { useEffect, useState } from 'react';
import {
  Plus, MapPin, Tag, ArrowLeft, Lock, CheckCircle2,
  ChevronDown, ChevronRight, Loader2, User, Info, PackageOpen,
  TrendingUp, Clock, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function MyAreaManage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [combos, setCombos] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [myLeadCount, setMyLeadCount] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(null);

  // Create category modal
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catSaving, setCatSaving] = useState(false);

  // Add location form
  const [locForm, setLocForm] = useState({ name: '', parent: '' });
  const [locSaving, setLocSaving] = useState(false);

  // 🆕 Lead loading state
  const [leadLoadingId, setLeadLoadingId] = useState(null);

  const load = async () => {
    try {
      const [combosRes, myRes, leadCountRes] = await Promise.all([
        api.get('/assignments/all-combos'),
        api.get('/assignments/my'),
        api.get('/leads/my-count'),
      ]);

      const validCombos = (combosRes.data.data || [])
        .filter((cat) => cat && cat._id && cat.name)
        .map((cat) => ({
          ...cat,
          locations: (cat.locations || []).filter(
            (loc) => loc && loc._id && loc.name
          ),
        }));

      setCombos(validCombos);
      setMyAssignments(myRes.data.data || []);
      setMyLeadCount(leadCountRes.data.data || { today: 0, week: 0, month: 0, total: 0 });

      const exp = {};
      validCombos.forEach((cat) => {
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

  const myKeys = new Set(
    myAssignments.map((a) => `${a.category?._id}_${a.location?._id}`)
  );

  const toggle = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  /* Create category */
  const submitCategory = async (e) => {
    e.preventDefault();
    setCatSaving(true);
    try {
      await api.post('/categories/sales-create', catForm);
      success('Category created! Ab iske andar locations add karo.');
      setCatModal(false);
      setCatForm({ name: '', description: '' });
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setCatSaving(false);
    }
  };

  /* Add location + auto-claim */
  const submitLocation = async (e) => {
    e.preventDefault();
    if (!selectedCat) return;
    setLocSaving(true);
    try {
      await api.post('/category-locations/sales-create', {
        category: selectedCat._id,
        name: locForm.name,
        parent: locForm.parent || null,
      });
      success('Location added and auto-claimed ✅');
      setLocForm({ name: '', parent: '' });
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setLocSaving(false);
    }
  };

  /* Claim available combo */
  const handleClaim = async (cat, node) => {
    if (!node.available && !myKeys.has(`${cat._id}_${node._id}`)) {
      toastError(`Already taken by ${node.takenBy?.name} 🔒`);
      return;
    }
    if (myKeys.has(`${cat._id}_${node._id}`)) return;

    if (!confirm(`Claim "${cat.name} → ${node.name}"?`)) return;

    try {
      await api.post('/assignments/claim', {
        category: cat._id,
        location: node._id,
      });
      success('Claimed!');
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    }
  };

  /* 🆕 Direct Add Lead (+1 Counter) */
  const handleAddLead = async (cat, node) => {
    setLeadLoadingId(node._id);
    try {
      await api.post('/leads', {
        category: cat._id,
        location: node._id,
      });
      success('Lead count badh gaya! +1 🎯');
      await load(); // Refresh karo taaki count update ho jaye
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    } finally {
      setLeadLoadingId(null);
    }
  };

  /* 🆕 Toggle status Done/Pending */
  const handleToggleStatus = async (assignmentId, action) => {
    try {
      await api.patch(`/assignments/${assignmentId}/${action}`);
      success(
        action === 'done' ? 'Marked as Done ✅' : 'Reopened as Pending'
      );
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed');
    }
  };

  const renderLocation = (cat, node, depth = 0) => {
    const key = `${cat._id}_${node._id}`;
    const isMine = myKeys.has(key);
    const isTakenByOther = !node.available && !isMine;
    const hasChildren = node.children?.length > 0;
    const expandKey = `exp_${key}`;
    const isExpanded = expanded[expandKey];

    const myAssignment = myAssignments.find(
      (a) => `${a.category?._id}_${a.location?._id}` === key
    );
    const status = myAssignment?.status || null;
    const leads = node.leadStats || { today: 0, total: 0 };
    const isLeadLoading = leadLoadingId === node._id;

    let bgClass = 'bg-white border-slate-200';
    if (isMine) {
      bgClass =
        status === 'Done'
          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
          : 'bg-amber-50 border-amber-400 ring-1 ring-amber-300';
    } else if (isTakenByOther) {
      bgClass = 'bg-slate-50 border-slate-200 opacity-70';
    }

    return (
      <div key={node._id}>
        <div
          className={`mb-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${bgClass}`}
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
              className={
                isMine
                  ? status === 'Done'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                  : 'text-slate-400'
              }
            />
            <span
              className={`font-medium ${
                isTakenByOther ? 'text-slate-500' : 'text-slate-800'
              }`}
            >
              {node.name}
            </span>

            {isMine && status === 'Done' && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 size={10} /> Done
              </span>
            )}
            {isMine && status === 'Pending' && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Clock size={10} /> Pending
              </span>
            )}

            {/* Lead badge - shows count only */}
            {(isMine || isTakenByOther) && (
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                  leads.today > 0
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
                title={`Total leads: ${leads.total}`}
              >
                <TrendingUp size={10} /> {leads.today} today
              </span>
            )}

            {isTakenByOther && (
              <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                <Lock size={10} /> Taken by {node.takenBy?.name}
              </span>
            )}
            {node.available && !isMine && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Available
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {node.available && !isMine && (
              <button
                onClick={() => handleClaim(cat, node)}
                className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Claim
              </button>
            )}

            {isMine && myAssignment && (
              <>
                {/* 🆕 Simple +1 Lead Button */}
                <button
                  onClick={() => handleAddLead(cat, node)}
                  disabled={isLeadLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  title="Add +1 Lead"
                >
                  {isLeadLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <><Plus size={12} /> Lead</>
                  )}
                </button>

                {status === 'Done' ? (
                  <button
                    onClick={() => handleToggleStatus(myAssignment._id, 'pending')}
                    className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    Reopen
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(myAssignment._id, 'done')}
                    className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Mark Done
                  </button>
                )}
              </>
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

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            My Category Manager
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nayi category banao, locations add karo, aur client aate hi Lead button dabao.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/sales/my-assignments')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Back
          </button>
          <button
            onClick={() => setCatModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      {/* Lead summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            Aaj ke Leads
          </p>
          <p className="mt-1 text-3xl font-bold text-purple-700">
            {myLeadCount.today}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Is Hafte
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-700">
            {myLeadCount.week}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Is Mahine
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-700">
            {myLeadCount.month}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Total
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">
            {myLeadCount.total}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Auto-Claim Rule</p>
          <p className="mt-0.5">
            Aap jo bhi <strong>category ya location</strong> banayenge — wo{' '}
            <strong>automatically aapko assign</strong> ho jayegi. Doosre sales
            persons use select nahi kar payenge. Client aate hi{' '}
            <strong>"+ Lead"</strong> button dabao, count badh jayega.
          </p>
        </div>
      </div>

      {/* Location add form */}
      {selectedCat && (
        <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Add Location in
              </p>
              <p className="mt-1 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Tag size={16} className="text-blue-500" />
                {selectedCat.name}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCat(null);
                setLocForm({ name: '', parent: '' });
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={submitLocation} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Location Name *
                </label>
                <input
                  required
                  placeholder="e.g., Faridabad, Sector 7"
                  value={locForm.name}
                  onChange={(e) =>
                    setLocForm({ ...locForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Parent (optional)
                </label>
                <select
                  value={locForm.parent}
                  onChange={(e) =>
                    setLocForm({ ...locForm, parent: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">No parent (top-level)</option>
                  {(selectedCat.locations || []).map((l) => (
                    <option key={l._id} value={l._id}>
                      {'  '.repeat(l.level || 0)}
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={locSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={16} /> {locSaving ? 'Adding...' : 'Add & Auto-Claim'}
            </button>
          </form>
        </div>
      )}

      {/* Categories tree */}
      <div className="space-y-4">
        {combos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <PackageOpen className="mx-auto text-slate-300" size={36} />
            <p className="mt-2 text-sm text-slate-500">
              Abhi koi category nahi hai. Upar "New Category" se banao.
            </p>
          </div>
        ) : (
          combos.map((cat) => {
            const isMineCat =
              (cat.locations || []).every((loc) =>
                myKeys.has(`${cat._id}_${loc._id}`)
              ) && cat.locations.length > 0;

            const catLeadTotal = (cat.locations || []).reduce(
              (sum, loc) => sum + (loc.leadStats?.total || 0),
              0
            );
            const catLeadToday = (cat.locations || []).reduce(
              (sum, loc) => sum + (loc.leadStats?.today || 0),
              0
            );

            return (
              <div
                key={cat._id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag size={16} className="text-blue-500" />
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    {isMineCat && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        All yours
                      </span>
                    )}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {cat.locations.length} loc
                    </span>
                    {catLeadTotal > 0 && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          catLeadToday > 0
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title={`Total: ${catLeadTotal}`}
                      >
                        🎯 {catLeadToday} today
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedCat(cat)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus size={12} /> Add Location
                  </button>
                </div>

                {cat.locations.length === 0 ? (
                  <div className="rounded bg-slate-50 px-3 py-2.5 text-xs text-slate-500 italic">
                    No locations yet — "Add Location" click karo
                  </div>
                ) : (
                  cat.locations.map((loc) => renderLocation(cat, loc))
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Category Create Modal */}
      {catModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setCatModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              New Category
            </h2>
            <form onSubmit={submitCategory} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Category Name *
                </label>
                <input
                  required
                  autoFocus
                  placeholder="e.g., Drama, Villa, Plot"
                  value={catForm.name}
                  onChange={(e) =>
                    setCatForm({ ...catForm, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Description (optional)
                </label>
                <input
                  placeholder="Short description"
                  value={catForm.description}
                  onChange={(e) =>
                    setCatForm({ ...catForm, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {catSaving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}