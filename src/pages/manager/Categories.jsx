import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Tag, ChevronRight, FolderKanban } from 'lucide-react';
import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Categories() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setList(res.data.data);
    } catch {
      toastError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/categories', form);
      success('Category added successfully');
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Deactivate category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      success('Category deactivated');
      load();
    } catch {
      toastError('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <p className="mt-1 text-sm text-slate-500">
          Category banao (e.g., Drama, Villa, Plot) — phir uske andar nested
          locations add karo.
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">
          Add New Category
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                placeholder="e.g., Drama"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Description (optional)
              </label>
              <input
                placeholder="Short description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={16} /> {saving ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* List */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          All Categories ({list.length})
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <FolderKanban className="mx-auto text-slate-300" size={32} />
            <p className="mt-2 text-sm text-slate-500">
              Abhi koi category nahi hai. Upar se add karo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <Tag size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      {c.description && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(c._id, c.name)}
                    className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50"
                    title="Deactivate"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <button
                  onClick={() =>
                    navigate(`/manager/categories/${c._id}/locations`)
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Manage Locations <ChevronRight size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}