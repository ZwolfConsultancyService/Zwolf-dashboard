import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Tag,
  IndianRupee,
  Clock,
  Sparkles,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Loader from '../../components/ui/Loader.jsx';

/* =========================================================
   CATEGORIES & PRICE TYPES
========================================================= */

const CATEGORIES = [
  'Custom Software',
  'Web Application',
  'Mobile App',
  'CRM',
  'ERP',
  'E-commerce',
  'SaaS',
  'Website',
  'UI/UX Design',
  'Digital Marketing',
  'SEO',
  'Other',
];

const PRICE_TYPES = ['Fixed', 'Hourly', 'Monthly', 'Custom'];

/* =========================================================
   🆕 CATEGORY → DEFAULT IMAGE MAP
========================================================= */

const CATEGORY_IMAGES = {
  'Custom Software':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
  'Web Application':
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
  'Mobile App':
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
  CRM:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  ERP:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'E-commerce':
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
  SaaS:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
  Website:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80',
  'UI/UX Design':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  'Digital Marketing':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  SEO:
    'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=800&q=80',
  Other:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';

const getProductImage = (product) => {
  if (product.image && product.image.trim()) {
    return product.image;
  }
  return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
};

const initialForm = {
  name: '',
  category: 'Custom Software',
  shortDescription: '',
  description: '',
  startingPrice: 0,
  priceType: 'Custom',
  features: [],
  technology: [],
  image: '',
  deliveryTime: '',
  isActive: true,
  order: 0,
};

/* =========================================================
   MANAGER PRODUCTS PAGE
========================================================= */

export default function ManagerProducts() {
  const { success, error: toastError } = useToast();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [featureInput, setFeatureInput] = useState('');
  const [techInput, setTechInput] = useState('');

  /* =========================================================
     LOAD
  ========================================================= */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;

      const { data } = await api.get('/products', { params });

      setProducts(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to load products'
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, category, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     OPEN CREATE
  ========================================================= */

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFeatureInput('');
    setTechInput('');
    setModalOpen(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const openEdit = (product) => {
    setEditing(product);

    setForm({
      name: product.name || '',
      category: product.category || 'Custom Software',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      startingPrice: product.startingPrice || 0,
      priceType: product.priceType || 'Custom',
      features: product.features || [],
      technology: product.technology || [],
      image: product.image || '',
      deliveryTime: product.deliveryTime || '',
      isActive: product.isActive ?? true,
      order: product.order || 0,
    });

    setFeatureInput('');
    setTechInput('');
    setModalOpen(true);
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        startingPrice: Number(form.startingPrice) || 0,
        order: Number(form.order) || 0,
      };

      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        success('Product created successfully');
      }

      setModalOpen(false);
      setEditing(null);
      setForm(initialForm);
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to save product'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */

  const toggleStatus = async (product) => {
    try {
      await api.patch(`/products/${product._id}/toggle-status`);
      success(
        product.isActive
          ? 'Product disabled'
          : 'Product enabled'
      );
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to toggle status'
      );
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const remove = async (product) => {
    if (
      !confirm(
        `Delete product "${product.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/products/${product._id}`);
      success('Product deleted successfully');
      load();
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete product'
      );
    }
  };

  /* =========================================================
     FEATURE / TECH INPUT
  ========================================================= */

  const addFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    if (form.features.includes(val)) {
      setFeatureInput('');
      return;
    }
    setForm({ ...form, features: [...form.features, val] });
    setFeatureInput('');
  };

  const removeFeature = (f) => {
    setForm({
      ...form,
      features: form.features.filter((x) => x !== f),
    });
  };

  const addTech = () => {
    const val = techInput.trim();
    if (!val) return;
    if (form.technology.includes(val)) {
      setTechInput('');
      return;
    }
    setForm({ ...form, technology: [...form.technology, val] });
    setTechInput('');
  };

  const removeTech = (t) => {
    setForm({
      ...form,
      technology: form.technology.filter((x) => x !== t),
    });
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your products & services catalogue.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-[0_4px_12px_rgba(37,99,235,0.25)]
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:bg-blue-700
            hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]
            active:translate-y-0
            focus:outline-none
            focus:ring-4
            focus:ring-blue-500/20
          "
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Product
        </Button>
      </div>

      <Card>
        {/* FILTERS */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              className="input-base pl-9"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        {/* PRODUCT GRID */}
        {loading ? (
          <Loader />
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
              <Package size={21} />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-700">
              No products yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Add your first product to get started.
            </p>
            <Button
              size="sm"
              onClick={openCreate}
              className="mt-4 rounded-xl"
            >
              <Plus size={14} />
              Add Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onEdit={() => openEdit(p)}
                onToggle={() => toggleStatus(p)}
                onDelete={() => remove(p)}
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {pagination && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Basic Information
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Product name, category, and details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Product Name *"
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <Select
                label="Category *"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>

              <div className="md:col-span-2">
                <Input
                  label="Short Description"
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      shortDescription: e.target.value,
                    })
                  }
                  placeholder="Brief one-liner about the product (max 200 chars)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                  Full Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Detailed description..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Delivery */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Pricing & Delivery
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Set starting price and delivery timeline.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                label="Starting Price (₹)"
                type="number"
                min="0"
                value={form.startingPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startingPrice: e.target.value,
                  })
                }
                placeholder="25000"
              />

              <Select
                label="Price Type"
                value={form.priceType}
                onChange={(e) =>
                  setForm({ ...form, priceType: e.target.value })
                }
              >
                {PRICE_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>

              <Input
                label="Delivery Time"
                value={form.deliveryTime}
                onChange={(e) =>
                  setForm({ ...form, deliveryTime: e.target.value })
                }
                placeholder="4-6 weeks"
              />
            </div>
          </div>

          {/* Features */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Features
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Add key features of this product.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="e.g. Lead Management"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addFeature}
              >
                Add
              </Button>
            </div>

            {form.features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeFeature(f)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Technology */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Technology Stack
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Tech stack used in this product.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTech();
                  }
                }}
                placeholder="e.g. React"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTech}
              >
                Add
              </Button>
            </div>

            {form.technology.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.technology.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTech(t)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image & Order */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Display Settings
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Image URL (optional)"
                value={form.image}
                onChange={(e) =>
                  setForm({ ...form, image: e.target.value })
                }
                placeholder="Leave blank to use category default"
              />

              <Input
                label="Display Order"
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm({ ...form, order: e.target.value })
                }
                placeholder="0"
              />
            </div>

            {/* 🆕 Preview */}
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-gray-500">
                Preview
              </p>
              <div className="h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={
                    form.image && form.image.trim()
                      ? form.image
                      : CATEGORY_IMAGES[form.category] || DEFAULT_IMAGE
                  }
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_IMAGE;
                  }}
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                {form.image && form.image.trim()
                  ? 'Custom image'
                  : `Default image for "${form.category}"`}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active (visible to clients)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="rounded-xl px-5"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              loading={saving}
              className="rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {editing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================
   PRODUCT CARD (Manager)
========================================================= */

function ProductCard({ product, onEdit, onToggle, onDelete }) {
  /* 🆕 Get image — product image OR category default */
  const imageUrl = getProductImage(product);

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = DEFAULT_IMAGE;
          }}
        />

        {/* Status Badge */}
        <div className="absolute right-2 top-2">
          <span
            className={`
              rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
              ${
                product.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }
            `}
          >
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* 🆕 Category badge */}
        <div className="absolute left-2 top-2">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 shadow-sm backdrop-blur">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
            {product.category}
          </span>
        </div>

        {/* Name */}
        <h3 className="mt-1 truncate text-base font-semibold text-gray-900">
          {product.name}
        </h3>

        {/* Short desc */}
        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {product.shortDescription}
          </p>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <IndianRupee size={12} className="text-green-600" />
            <span className="text-sm font-bold text-green-600">
              {product.startingPrice
                ? `${Number(product.startingPrice).toLocaleString('en-IN')}+`
                : 'Custom'}
            </span>
          </div>

          {product.deliveryTime && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={11} />
              {product.deliveryTime}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
          >
            <Pencil size={12} />
            Edit
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
            title={product.isActive ? 'Disable' : 'Enable'}
          >
            {product.isActive ? (
              <EyeOff size={14} />
            ) : (
              <Eye size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-600 transition hover:bg-red-100"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}