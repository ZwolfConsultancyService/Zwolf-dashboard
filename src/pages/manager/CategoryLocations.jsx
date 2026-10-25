import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, MapPin, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function CategoryLocations() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [category, setCategory] = useState(null);
  const [tree, setTree] = useState([]);
  const [flat, setFlat] = useState([]);
  const [form, setForm] = useState({ name: '', parent: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, treeRes, flatRes] = await Promise.all([
        api.get('/categories'),
        api.get('/category-locations/tree', { params: { category: categoryId } }),
        api.get('/category-locations', { params: { category: categoryId } }),
      ]);
      setCategory(catRes.data.data.find((c) => c._id === categoryId));
      setTree(treeRes.data.data);
      setFlat(flatRes.data.data);
      // Sab expand kar de by default
      const expandedMap = {};
      flatRes.data.data.forEach((l) => {
        expandedMap[l._id] = true;
      });
      setExpanded(expandedMap);
    } catch {
      toastError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryId]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/category-locations', {
        category: categoryId,
        name: form.name,
        parent: form.parent || null,
      });
      success('Location added');
      setForm({ name: '', parent: '' });
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add location');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Deactivate location "${name}"?`)) return;
    try {
      await api.delete(`/category-locations/${id}`);
      success('Location deactivated');
      load();
    } catch {
      toastError('Failed to delete');
    }
  };

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children?.length > 0;
    const isExpanded = expanded[node._id];

    return (
      <div key={node._id}>
        <div
          className="mb-1 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300"
          style={{ marginLeft: depth * 24 }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => toggle(node._id)}
                className="text-slate-400 hover:text-slate-700"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}
            <MapPin
              size={14}
              className={depth === 0 ? 'text-blue-500' : 'text-slate-400'}
            />
            <span
              className={`font-medium ${
                depth === 0 ? 'text-slate-900' : 'text-slate-700'
              }`}
            >
              {node.name}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
              L{depth}
            </span>
          </div>
          <button
            onClick={() => remove(node._id, node.name)}
            className="rounded-md p-1 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/manager/categories')}
          className="rounded-lg border border-slate-200 bg-white p-2 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {category?.name || '...'} — Locations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Nested locations add karo (e.g., Faridabad → Sector 7)
          </p>
        </div>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Add New Location
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                placeholder="e.g., Faridabad or Sector 7"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Parent Location (optional)
              </label>
              <select
                value={form.parent}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">No parent (Top-level)</option>
                {flat.map((l) => (
                  <option key={l._id} value={l._id}>
                    {'  '.repeat(l.level)}
                    {l.level === 0 ? '📁' : '📄'} {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} /> {saving ? 'Adding...' : 'Add Location'}
          </button>
        </form>
      </div>

      {/* Tree */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Location Hierarchy ({flat.length})
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : tree.length === 0 ? (
            <p className="text-sm text-slate-500">
              No locations yet. Upar se add karo.
            </p>
          ) : (
            tree.map((n) => renderNode(n))
          )}
        </div>
      </div>
    </div>
  );
}