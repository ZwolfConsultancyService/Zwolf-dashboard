import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Tag,
  IndianRupee,
  Clock,
  CheckCircle2,
  Sparkles,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CalendarDays,
  UserCircle,
} from 'lucide-react';

import api from '../../api/axios.js';
import { useToast } from '../../context/ToastContext.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Loader from '../../components/ui/Loader.jsx';
import { formatDateTime } from '../../utils/format.js';

/* =========================================================
   CATEGORY → DEFAULT IMAGE MAP
========================================================= */

const CATEGORY_IMAGES = {
  'Custom Software':
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1600&q=80',
  'Web Application':
    'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1600&q=80',
  'Mobile App':
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1600&q=80',
  CRM:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80',
  ERP:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
  'E-commerce':
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80',
  SaaS:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80',
  Website:
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1600&q=80',
  'UI/UX Design':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1600&q=80',
  'Digital Marketing':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80',
  SEO:
    'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=1600&q=80',
  Other:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80';

const getProductImage = (product) => {
  if (product?.image && product.image.trim()) {
    return product.image;
  }
  return CATEGORY_IMAGES[product?.category] || DEFAULT_IMAGE;
};

/* =========================================================
   MANAGER PRODUCT DETAIL PAGE
========================================================= */

export default function ManagerProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data);
      } catch (err) {
        console.error('product load err:', err);
        toastError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, toastError]);

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */

  const toggleStatus = async () => {
    if (!product) return;

    try {
      setActionLoading(true);

      await api.patch(`/products/${product._id}/toggle-status`);

      success(
        product.isActive ? 'Product disabled' : 'Product enabled'
      );

      setProduct((prev) => ({
        ...prev,
        isActive: !prev.isActive,
      }));
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to toggle status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const removeProduct = async () => {
    if (!product) return;

    if (
      !confirm(
        `Delete product "${product.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);

      await api.delete(`/products/${product._id}`);

      success('Product deleted successfully');
      navigate('/manager/products');
    } catch (err) {
      toastError(
        err.response?.data?.message || 'Failed to delete product'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================================
     COPY PRODUCT NAME
  ========================================================= */

  const copyName = async () => {
    if (!product) return;

    try {
      await navigator.clipboard.writeText(product.name);
      success('Product name copied');
    } catch {
      toastError('Failed to copy');
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return <Loader text="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Package size={40} className="mx-auto text-gray-300" />

        <h3 className="mt-3 text-sm font-semibold text-gray-900">
          Product not found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          This product may have been removed.
        </p>

        <Button
          onClick={() => navigate('/manager/products')}
          className="mt-4 rounded-xl"
        >
          <ArrowLeft size={14} />
          Back to Products
        </Button>
      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  const imageUrl = getProductImage(product);

  return (
    <div className="space-y-6">
      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={() => navigate('/manager/products')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      {/* HERO SECTION */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 lg:h-auto">
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.src = DEFAULT_IMAGE;
              }}
            />

            {/* Category badge */}
            <div className="absolute left-4 top-4">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 shadow-sm backdrop-blur">
                {product.category}
              </span>
            </div>

            {/* Status badge */}
            <div className="absolute right-4 top-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${
                  product.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 lg:p-8">
            {/* Category line */}
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                {product.category}
              </span>
            </div>

            {/* Name + copy */}
            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                {product.name}
              </h1>

              <button
                type="button"
                onClick={copyName}
                className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-gray-400 transition hover:bg-gray-50 hover:text-blue-600"
                title="Copy product name"
              >
                <Copy size={14} />
              </button>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {product.shortDescription}
              </p>
            )}

            {/* Price + Delivery */}
            <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-gray-100 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  Starting Price
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <IndianRupee
                    size={16}
                    className="text-green-600"
                  />
                  <span className="text-2xl font-bold text-green-600">
                    {product.startingPrice
                      ? `${Number(product.startingPrice).toLocaleString('en-IN')}+`
                      : 'Custom'}
                  </span>
                </div>
                {product.priceType && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {product.priceType}
                  </p>
                )}
              </div>

              {product.deliveryTime && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Delivery Time
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-base font-semibold text-gray-800">
                      {product.deliveryTime}
                    </span>
                  </div>
                </div>
              )}

              {product.order !== undefined && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    Display Order
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-800">
                    #{product.order}
                  </p>
                </div>
              )}
            </div>

            {/* =================================================
                ACTIONS — Manager specific
            ================================================= */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                onClick={() =>
                  navigate('/manager/products')
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_4px_12px_rgba(37,99,235,0.25)]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-blue-700
                  hover:shadow-[0_6px_18px_rgba(37,99,235,0.3)]
                "
              >
                <Pencil size={16} />
                Edit Product
              </Button>

              <Button
                variant="outline"
                onClick={toggleStatus}
                disabled={actionLoading}
                className="rounded-xl px-5 py-3"
              >
                {product.isActive ? (
                  <>
                    <EyeOff size={15} />
                    Disable
                  </>
                ) : (
                  <>
                    <Eye size={15} />
                    Enable
                  </>
                )}
              </Button>

              <Button
                variant="danger"
                onClick={removeProduct}
                disabled={actionLoading}
                className="rounded-xl px-5 py-3"
              >
                <Trash2 size={15} />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FULL DESCRIPTION
      ===================================================== */}
      {product.description && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              About this Product
            </h2>
          </div>
          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {product.description}
            </p>
          </div>
        </Card>
      )}

      {/* =====================================================
          FEATURES
      ===================================================== */}
      {product.features && product.features.length > 0 && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Key Features
                </h2>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {product.features.length}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {product.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <CheckCircle2 size={16} />
                  </div>

                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* =====================================================
          TECHNOLOGY STACK
      ===================================================== */}
      {product.technology && product.technology.length > 0 && (
        <Card>
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-purple-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Technology Stack
                </h2>
              </div>

              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {product.technology.length}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {product.technology.map((tech, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* =====================================================
          META INFO (Manager only)
      ===================================================== */}
      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Product Info
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <InfoRow
            icon={Tag}
            label="Category"
            value={product.category}
          />

          <InfoRow
            icon={IndianRupee}
            label="Price Type"
            value={product.priceType || '—'}
          />

          <InfoRow
            icon={CalendarDays}
            label="Created"
            value={
              product.createdAt
                ? formatDateTime(product.createdAt)
                : '—'
            }
          />

          <InfoRow
            icon={CalendarDays}
            label="Last Updated"
            value={
              product.updatedAt
                ? formatDateTime(product.updatedAt)
                : '—'
            }
          />

          {product.createdBy && (
            <InfoRow
              icon={UserCircle}
              label="Created By"
              value={
                typeof product.createdBy === 'object'
                  ? product.createdBy.name
                  : '—'
              }
            />
          )}

          <InfoRow
            icon={Eye}
            label="Status"
            value={product.isActive ? 'Active' : 'Inactive'}
          />
        </div>
      </Card>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-gray-800">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}