import { useEffect, useState } from 'react';
import {
  MapPin, Tag, ShieldCheck, Lock, CheckCircle2,
  ChevronDown, ChevronRight, Star, Loader2, PackageOpen,
} from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function MyAssignments() {
  const { success, error: toastError } = useToast();
  const [combos, setCombos] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const load = async () => {
    try {
      const [combosRes, myRes] = await Promise.all([
        api.get('/assignments/all-combos'),
        api.get('/assignments/my'),
      ]);

      // 🆕 Filter combos — sirf valid categories + locations (empty bhi rakho)
      const validCombos = (combosRes.data.data || [])
        .filter((cat) => cat && cat._id && cat.name)
        .map((cat) => ({
          ...cat,
          locations: (cat.locations || []).filter(
            (loc) => loc && loc._id && loc.name
          ),
        }));
      // ✅ Empty categories bhi retained — "No locations" dikhega

      setCombos(validCombos);

      // 🆕 Filter assignments — jinka category/location exist karta ho
      const validAssignments = (myRes.data.data || []).filter((a) => {
        return a && a.category && a.category._id && a.location && a.location._id;
      });
      setMyAssignments(validAssignments);

      // Auto-expand sirf jinme locations hain
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

  /* Claim combo — auto-assign to self */
  const handleClaim = async (cat, node) => {
    if (!node.available && !myKeys.has(`${cat._id}_${node._id}`)) {
      toastError(`Already taken by ${node.takenBy?.name} 🔒`);
      return;
    }

    if (myKeys.has(`${cat._id}_${node._id}`)) {
      return;
    }

    if (
      !confirm(
        `Claim "${cat.name} → ${node.name}" for yourself?\n\nEk baar claim kiya to dusre sales person isko select nahi kar payenge.`
      )
    ) {
      return;
    }

    setClaimingId(node._id);
    try {
      await api.post('/assignments/claim', {
        category: cat._id,
        location: node._id,
      });
      success('Combo claimed! 🎉 Ab yeh sirf aapka hai.');
      await load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to claim');
    } finally {
      setClaimingId(null);
    }
  };

  const renderLocation = (cat, node, depth = 0) => {
    const key = `${cat._id}_${node._id}`;
    const isMine = myKeys.has(key);
    const isTakenByOther = !node.available && !isMine;
    const hasChildren = node.children?.length > 0;
    const expandKey = `exp_${key}`;
    const isExpanded = expanded[expandKey];
    const isClaiming = claimingId === node._id;

    let bgClass = 'bg-white border-slate-200';
    if (isMine)
      bgClass = 'bg-green-50 border-green-400 ring-1 ring-green-300';
    else if (isTakenByOther)
      bgClass = 'bg-slate-50 border-slate-200 opacity-60';

    return (
      <div key={node._id}>
        <div
          className={`mb-1 flex items-center justify-between rounded-lg border px-3 py-2 transition ${bgClass}`}
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex flex-1 items-center gap-2">
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
              className={isMine ? 'text-green-600' : 'text-slate-400'}
            />
            <span
              className={`font-medium ${
                isTakenByOther ? 'text-slate-500' : 'text-slate-800'
              }`}
            >
              {node.name}
            </span>

            {isMine && (
              <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <Star size={10} /> Your Area
              </span>
            )}
            {isTakenByOther && (
              <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                <Lock size={10} /> Taken by {node.takenBy?.name}
              </span>
            )}
            {node.available && !isMine && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Available
              </span>
            )}
          </div>

          {node.available && !isMine && (
            <button
              onClick={() => handleClaim(cat, node)}
              disabled={isClaiming}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isClaiming ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Claiming...
                </>
              ) : (
                'Claim'
              )}
            </button>
          )}
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
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Categories & My Areas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Available combos ko khud claim karo. Ek baar claim kiya to sirf aapka.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-blue-600" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">
            {myAssignments.length} combos aap ke paas hain
          </p>
          <p className="mt-0.5">
            <strong>Available</strong> badge wale combos pe{' '}
            <strong>Claim</strong> button click karo. Ek baar claim ho gaya to
            dusre sales persons ke liye 🔒 blocked ho jayega.
          </p>
        </div>
      </div>

      {/* My assigned combos cards */}
      {myAssignments.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            My Claimed Areas ({myAssignments.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {myAssignments.map((a) => (
              <div
                key={a._id}
                className="rounded-xl border border-green-200 bg-gradient-to-br from-white to-green-50/30 p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <Tag size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {a.category?.name}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-slate-700">
                  <MapPin size={14} className="text-green-600" />
                  <span className="text-sm font-medium">
                    {a.location?.parent?.name && (
                      <span className="text-slate-400">
                        {a.location.parent.name} →{' '}
                      </span>
                    )}
                    {a.location?.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All combos tree */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          All Categories ({combos.length})
        </h2>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {combos.length === 0 ? (
            <p className="text-sm text-slate-500">
              No categories available right now.
            </p>
          ) : (
            combos.map((cat) => {
              // 🆕 Category ke apne count stats
              let total = 0;
              let available = 0;
              let mine = 0;
              let taken = 0;

              const countNodes = (nodes) => {
                nodes.forEach((n) => {
                  total++;
                  const key = `${cat._id}_${n._id}`;
                  if (myKeys.has(key)) mine++;
                  else if (!n.available) taken++;
                  else available++;
                  if (n.children?.length) countNodes(n.children);
                });
              };
              countNodes(cat.locations);

              return (
                <div
                  key={cat._id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  {/* Category header */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Tag size={14} className="text-blue-500" />
                    <span className="font-semibold text-slate-900">
                      {cat.name}
                    </span>

                    {/* 🆕 Stats badges */}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {cat.locations.length} locations
                    </span>

                    {total > 0 && (
                      <>
                        {available > 0 && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            {available} available
                          </span>
                        )}
                        {mine > 0 && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            {mine} yours
                          </span>
                        )}
                        {taken > 0 && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                            {taken} taken
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* 🆕 Empty state — koi location nahi */}
                  {cat.locations.length === 0 ? (
                    <div className="flex items-center gap-2 rounded bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                      <PackageOpen size={14} className="text-slate-400" />
                      <span>
                        No locations added yet in this category. Manager se
                        contact karo.
                      </span>
                    </div>
                  ) : (
                    cat.locations.map((loc) => renderLocation(cat, loc))
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}